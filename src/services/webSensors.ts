import type { LiveSensorsSnapshot } from '../types/sensor';
import { formatIso8601WithOffset, localDateKey } from '../utils/isoDate';
import { getDailyStepHistory, upsertDailySteps } from './localDb';

type GenericSensorInstance = {
  start: () => void;
  stop: () => void;
  addEventListener: (event: string, cb: () => void) => void;
  x?: number;
  y?: number;
  z?: number;
  illuminance?: number;
  pressure?: number;
};

type GenericSensorCtor = new (opts?: { frequency?: number }) => GenericSensorInstance;

interface BatteryManagerLike extends EventTarget {
  level: number;
  charging: boolean;
}

class AccelerometerStepDetector {
  private prevMag = 9.81;
  private above = false;
  private lastStepMs = 0;

  process(x: number, y: number, z: number): boolean {
    const mag = Math.sqrt(x * x + y * y + z * z);
    const smoothed = this.prevMag * 0.65 + mag * 0.35;
    const now = Date.now();
    let detected = false;
    if (!this.above && smoothed > 11.4) {
      if (now - this.lastStepMs >= 280) {
        this.above = true;
        this.lastStepMs = now;
        detected = true;
      }
    } else if (this.above && smoothed < 10.3) {
      this.above = false;
    }
    this.prevMag = smoothed;
    return detected;
  }
}

export class WebSensorHub {
  private snapshot: LiveSensorsSnapshot;
  private stepDetector = new AccelerometerStepDetector();
  private listeners = new Set<(snap: LiveSensorsSnapshot) => void>();
  private cleanupFns: Array<() => void> = [];
  private geoWatchId: number | null = null;
  private currentDateKey = localDateKey();
  private dailyGoal = 10000;
  private totalPriorSteps = 0;
  private started = false;

  constructor() {
    const requiresMotionPerm =
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function';

    this.snapshot = {
      accelerometer: { available: false, value: null, source: 'Unavailable' },
      gyroscope: { available: false, value: null, source: 'Unavailable' },
      magnetometer: { available: false, headingDeg: null, source: 'Unavailable' },
      barometer: { available: false, pressureHpa: null },
      ambientLight: { available: false, lux: null },
      proximity: { available: false, value: null, label: null },
      gps: {
        available: false,
        permissionState: typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'prompt' : 'unavailable',
        errorMessage: null,
        latitude: null,
        longitude: null,
        altitude: null,
        speed: null,
        bearing: null,
      },
      battery: { available: false, levelPercent: null, charging: null },
      steps: {
        hardwareAvailable: false,
        sourceLabel: 'Accelerometer step detection',
        todaySteps: 0,
        totalSteps: 0,
      },
      motionPermissionRequired: requiresMotionPerm,
      motionPermissionGranted: !requiresMotionPerm,
    };
  }

  subscribe(cb: (snap: LiveSensorsSnapshot) => void): () => void {
    this.listeners.add(cb);
    cb(this.getSnapshot());
    return () => {
      this.listeners.delete(cb);
    };
  }

  getSnapshot(): LiveSensorsSnapshot {
    return structuredClone(this.snapshot);
  }

  private emit(): void {
    const copy = this.getSnapshot();
    this.listeners.forEach((cb) => cb(copy));
  }

  async init(dailyGoal: number): Promise<void> {
    this.dailyGoal = dailyGoal;
    await this.loadStepHistory();

    if (this.started) return;
    this.started = true;

    this.initBattery();
    this.initGenericSensors();
    this.initDeviceMotionAndOrientation();
    this.initGeolocation();
  }

  private async loadStepHistory(): Promise<void> {
    this.currentDateKey = localDateKey();
    const history = await getDailyStepHistory();
    let today = 0;
    let prior = 0;
    for (const day of history) {
      if (day.dateKey === this.currentDateKey) {
        today = day.steps;
      } else {
        prior += day.steps;
      }
    }
    this.totalPriorSteps = prior;
    this.snapshot.steps.todaySteps = today;
    this.snapshot.steps.totalSteps = prior + today;
    await upsertDailySteps({
      dateKey: this.currentDateKey,
      steps: today,
      goal: this.dailyGoal,
      updatedAt: formatIso8601WithOffset(new Date()),
    });
    this.emit();
  }

  async updateDailyGoal(goal: number): Promise<void> {
    this.dailyGoal = goal;
    await upsertDailySteps({
      dateKey: this.currentDateKey,
      steps: this.snapshot.steps.todaySteps,
      goal: this.dailyGoal,
      updatedAt: formatIso8601WithOffset(new Date()),
    });
  }

  private async checkMidnightAndRecordStep(): Promise<void> {
    const nowKey = localDateKey();
    if (nowKey !== this.currentDateKey) {
      this.totalPriorSteps += this.snapshot.steps.todaySteps;
      this.currentDateKey = nowKey;
      this.snapshot.steps.todaySteps = 0;
    }
    this.snapshot.steps.todaySteps += 1;
    this.snapshot.steps.totalSteps = this.totalPriorSteps + this.snapshot.steps.todaySteps;
    await upsertDailySteps({
      dateKey: this.currentDateKey,
      steps: this.snapshot.steps.todaySteps,
      goal: this.dailyGoal,
      updatedAt: formatIso8601WithOffset(new Date()),
    });
    this.emit();
  }

  async requestMotionPermissions(): Promise<void> {
    const motionEvt = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof motionEvt?.requestPermission === 'function') {
      try {
        const res = await motionEvt.requestPermission();
        this.snapshot.motionPermissionGranted = res === 'granted';
      } catch {
        this.snapshot.motionPermissionGranted = false;
      }
    }
    const orientEvt = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof orientEvt?.requestPermission === 'function') {
      try {
        await orientEvt.requestPermission();
      } catch {
        // Ignore if denied
      }
    }
    this.initDeviceMotionAndOrientation();
    this.emit();
  }

  private initBattery(): void {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };
    if (typeof nav.getBattery !== 'function') return;

    nav
      .getBattery()
      .then((bat) => {
        const update = () => {
          this.snapshot.battery = {
            available: true,
            levelPercent: Math.round(bat.level * 100),
            charging: bat.charging,
          };
          this.emit();
        };
        update();
        bat.addEventListener('levelchange', update);
        bat.addEventListener('chargingchange', update);
        this.cleanupFns.push(() => {
          bat.removeEventListener('levelchange', update);
          bat.removeEventListener('chargingchange', update);
        });
      })
      .catch(() => {
        this.snapshot.battery.available = false;
      });
  }

  private initGenericSensors(): void {
    const win = window as unknown as Record<string, GenericSensorCtor | undefined>;

    if (win.Accelerometer) {
      try {
        const accel = new win.Accelerometer({ frequency: 10 });
        accel.addEventListener('reading', () => {
          if (accel.x === undefined || accel.y === undefined || accel.z === undefined) return;
          this.snapshot.accelerometer = {
            available: true,
            value: { x: accel.x, y: accel.y, z: accel.z },
            source: 'Generic Sensor API',
          };
          if (this.stepDetector.process(accel.x, accel.y, accel.z)) {
            void this.checkMidnightAndRecordStep();
          }
          this.emit();
        });
        accel.addEventListener('error', () => {
          // DeviceMotion fallback remains active
        });
        accel.start();
        this.cleanupFns.push(() => accel.stop());
      } catch {
        // Not supported or blocked by policy
      }
    }

    if (win.Gyroscope) {
      try {
        const gyro = new win.Gyroscope({ frequency: 10 });
        gyro.addEventListener('reading', () => {
          if (gyro.x === undefined || gyro.y === undefined || gyro.z === undefined) return;
          this.snapshot.gyroscope = {
            available: true,
            value: { x: gyro.x, y: gyro.y, z: gyro.z },
            source: 'Generic Sensor API',
          };
          this.emit();
        });
        gyro.start();
        this.cleanupFns.push(() => gyro.stop());
      } catch {
        // Fallback via devicemotion rotationRate
      }
    }

    if (win.Magnetometer) {
      try {
        const mag = new win.Magnetometer({ frequency: 5 });
        mag.addEventListener('reading', () => {
          if (mag.x === undefined || mag.y === undefined) return;
          let heading = (Math.atan2(mag.y, mag.x) * 180) / Math.PI;
          if (heading < 0) heading += 360;
          this.snapshot.magnetometer = {
            available: true,
            headingDeg: heading,
            source: 'Magnetometer',
          };
          this.emit();
        });
        mag.start();
        this.cleanupFns.push(() => mag.stop());
      } catch {
        // Fallback via deviceorientation
      }
    }

    if (win.AmbientLightSensor) {
      try {
        const light = new win.AmbientLightSensor({ frequency: 2 });
        light.addEventListener('reading', () => {
          if (light.illuminance === undefined) return;
          this.snapshot.ambientLight = {
            available: true,
            lux: light.illuminance,
          };
          this.emit();
        });
        light.start();
        this.cleanupFns.push(() => light.stop());
      } catch {
        // Unavailable on this browser/device
      }
    }

    if (win.Barometer) {
      try {
        const baro = new win.Barometer({ frequency: 1 });
        baro.addEventListener('reading', () => {
          if (baro.pressure === undefined) return;
          this.snapshot.barometer = {
            available: true,
            pressureHpa: baro.pressure,
          };
          this.emit();
        });
        baro.start();
        this.cleanupFns.push(() => baro.stop());
      } catch {
        // Unavailable
      }
    }
  }

  private initDeviceMotionAndOrientation(): void {
    const onMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        this.snapshot.accelerometer = {
          available: true,
          value: { x: acc.x, y: acc.y, z: acc.z },
          source: 'DeviceMotionEvent',
        };
        if (this.stepDetector.process(acc.x, acc.y, acc.z)) {
          void this.checkMidnightAndRecordStep();
        }
      }
      const rot = e.rotationRate;
      if (rot && rot.alpha !== null && rot.beta !== null && rot.gamma !== null) {
        const toRad = Math.PI / 180;
        this.snapshot.gyroscope = {
          available: true,
          value: {
            x: rot.beta * toRad,
            y: rot.gamma * toRad,
            z: rot.alpha * toRad,
          },
          source: 'DeviceMotionEvent',
        };
      }
      this.emit();
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      const webkitCompass = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading;
      if (typeof webkitCompass === 'number') {
        this.snapshot.magnetometer = {
          available: true,
          headingDeg: webkitCompass,
          source: 'Compass Heading',
        };
        this.emit();
      } else if (e.alpha !== null) {
        const heading = (360 - e.alpha) % 360;
        this.snapshot.magnetometer = {
          available: true,
          headingDeg: heading,
          source: 'DeviceOrientation',
        };
        this.emit();
      }
    };

    const onProximity = (e: Event) => {
      const prox = e as Event & { value?: number; near?: boolean };
      if (typeof prox.value === 'number' || typeof prox.near === 'boolean') {
        const isNear = prox.near ?? (prox.value !== undefined ? prox.value < 5 : false);
        this.snapshot.proximity = {
          available: true,
          value: prox.value ?? (isNear ? 0 : 5),
          label: isNear ? 'Near' : 'Far',
        };
        this.emit();
      }
    };

    window.addEventListener('devicemotion', onMotion);
    window.addEventListener('deviceorientation', onOrientation);
    window.addEventListener('deviceproximity', onProximity);
    this.cleanupFns.push(() => {
      window.removeEventListener('devicemotion', onMotion);
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('deviceproximity', onProximity);
    });
  }

  initGeolocation(): void {
    if (!('geolocation' in navigator)) {
      this.snapshot.gps = {
        ...this.snapshot.gps,
        available: false,
        permissionState: 'unavailable',
        errorMessage: 'Geolocation API is not supported by this browser.',
      };
      this.emit();
      return;
    }

    if (this.geoWatchId !== null) {
      navigator.geolocation.clearWatch(this.geoWatchId);
    }

    this.geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.snapshot.gps = {
          available: true,
          permissionState: 'granted',
          errorMessage: null,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          bearing: pos.coords.heading,
        };
        this.emit();
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        this.snapshot.gps = {
          ...this.snapshot.gps,
          available: false,
          permissionState: denied ? 'denied' : 'prompt',
          errorMessage: denied
            ? 'Location permission denied. Allow location access in browser settings.'
            : 'GPS signal unavailable or location services disabled on device.',
        };
        this.emit();
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }

  dispose(): void {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
    if (this.geoWatchId !== null) {
      navigator.geolocation.clearWatch(this.geoWatchId);
      this.geoWatchId = null;
    }
    this.started = false;
  }
}
