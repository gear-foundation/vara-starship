/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Account } from '@gear-js/react-hooks';
import { Heart, Zap } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';

import { GAME_CONFIG, BOSS_CONFIG } from './game-config';
import { ResultsScreen } from './results-screen';

interface GameObject {
  id: string;
  x: number;
  y: number;
  rotation?: number;
  speed?: number;
  phase?: number;
  rotationSpeed?: number;
  x0?: number;
  y0?: number;
  ampX?: number;
  phaseX?: number;
  ampY?: number;
  phaseY?: number;
  born?: number;
  size?: number;
}

interface InGameScreenProps {
  onBackToMenu: () => void;
  onReplayGame: () => void;
  playerPTS: number;
  gamesAvailable: number;
  shipLevel: number;
  boosterCount: number;
  account: Account | undefined;
  integerBalanceDisplay: {
    value?: string;
    unit?: string;
  };
}

// === КОНФИГ ДЛЯ ГЕНЕРАЦИИ ФОНА ИГРОВОГО ЭКРАНА ===
const GAME_BG_CONFIG = GAME_CONFIG.GAME_BG_CONFIG;

// === ФУНКЦИЯ ГЕНЕРАЦИИ ПАРАМЕТРОВ ФОНА ===
function generateGameBgParams(cfg = GAME_BG_CONFIG) {
  // Генерация звёзд
  const starCount = Math.floor(cfg.starCount.min + Math.random() * (cfg.starCount.max - cfg.starCount.min + 1));
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: cfg.starSize.min + Math.random() * (cfg.starSize.max - cfg.starSize.min),
    color: cfg.starColors[Math.floor(Math.random() * cfg.starColors.length)],
    twinkle: cfg.starTwinkle.min + Math.random() * (cfg.starTwinkle.max - cfg.starTwinkle.min),
    phase: Math.random() * Math.PI * 2,
  }));
  // Генерация планет
  const planetCount = Math.floor(cfg.planetCount.min + Math.random() * (cfg.planetCount.max - cfg.planetCount.min + 1));
  const planets = Array.from({ length: planetCount }, () => {
    const colorPair = cfg.planetColors[Math.floor(Math.random() * cfg.planetColors.length)];
    return {
      x: Math.random(),
      y: Math.random(),
      size: cfg.planetSize.min + Math.random() * (cfg.planetSize.max - cfg.planetSize.min),
      colorFrom: colorPair[0],
      colorTo: colorPair[1],
      opacity: cfg.planetOpacity.min + Math.random() * (cfg.planetOpacity.max - cfg.planetOpacity.min),
      blur: 8 + Math.random() * 12,
    };
  });
  // Генерация туманностей
  const nebulaCount = Math.floor(cfg.nebulaCount.min + Math.random() * (cfg.nebulaCount.max - cfg.nebulaCount.min + 1));
  const nebulas = Array.from({ length: nebulaCount }, () => {
    const colorPair = cfg.nebulaColors[Math.floor(Math.random() * cfg.nebulaColors.length)];
    return {
      x: Math.random(),
      y: Math.random(),
      size: cfg.nebulaSize.min + Math.random() * (cfg.nebulaSize.max - cfg.nebulaSize.min),
      colorFrom: colorPair[0],
      colorTo: colorPair[1],
      opacity: cfg.nebulaOpacity.min + Math.random() * (cfg.nebulaOpacity.max - cfg.nebulaOpacity.min),
      blur: 32 + Math.random() * 32,
    };
  });
  // Цвет поля
  const fieldColor = cfg.fieldColors[Math.floor(Math.random() * cfg.fieldColors.length)];
  return { stars, planets, nebulas, fieldColor };
}

// === ПАРАМЕТРЫ СКОРОСТИ ===
const MINE_SPEED = GAME_CONFIG.MINE_SPEED;
const backgroundScrollSpeed = GAME_CONFIG.BACKGROUND_SCROLL_SPEED;

// === КОНСТАНТЫ РАЗМЕРОВ И СКОРОСТЕЙ ===
const PLAYER_SHIP_BASE_SIZE = GAME_CONFIG.PLAYER_SHIP_BASE_SIZE;
const PLAYER_SHIP_SIZE_STEP = GAME_CONFIG.PLAYER_SHIP_SIZE_STEP;
const ENEMY_SIZE = GAME_CONFIG.ENEMY_SIZE;
const ASTEROID_SIZE_MIN = GAME_CONFIG.ASTEROID_SIZE_MIN;
const ASTEROID_SIZE_MAX = GAME_CONFIG.ASTEROID_SIZE_MAX;
const MINE_SIZE = GAME_CONFIG.MINE_SIZE;
const PLAYER_LASER_WIDTH = GAME_CONFIG.PLAYER_LASER_WIDTH;
const PLAYER_LASER_HEIGHT = GAME_CONFIG.PLAYER_LASER_HEIGHT;
const PLAYER_ROCKET_WIDTH = GAME_CONFIG.PLAYER_ROCKET_WIDTH;
const PLAYER_ROCKET_HEIGHT = GAME_CONFIG.PLAYER_ROCKET_HEIGHT;
const ENEMY_LASER_WIDTH = GAME_CONFIG.ENEMY_LASER_WIDTH;
const ENEMY_LASER_HEIGHT = GAME_CONFIG.ENEMY_LASER_HEIGHT;

const ASTEROID_SPEED_MIN = GAME_CONFIG.ASTEROID_SPEED_MIN;
const ASTEROID_SPEED_MAX = GAME_CONFIG.ASTEROID_SPEED_MAX;

// === КОНФИГ ДЛЯ БУСТЕРОВ ===
const BOOSTER_CONFIG = GAME_CONFIG.BOOSTER_CONFIG;

export default function InGameScreen({
  onBackToMenu,
  onReplayGame,
  playerPTS,
  gamesAvailable,
  shipLevel,
  boosterCount,
  account,
  integerBalanceDisplay,
}: InGameScreenProps) {
  // === ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ НА ВЕРХНЕМ УРОВНЕ ===
  // Основное состояние игры
  const [gameTime, setGameTime] = useState(GAME_CONFIG.GAME_DURATION);
  const [playerHP, setPlayerHP] = useState(GAME_CONFIG.INITIAL_PLAYER_HP);
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(10);
  const [showResults, setShowResults] = useState(false);
  const [isVictory, setIsVictory] = useState(true);
  const [playerVARA] = useState(500);
  const [ptsEarned, setPtsEarned] = useState(0);
  const [playerExists, setPlayerExists] = useState(true);
  // === СОСТОЯНИЕ ДЛЯ БОССА ===
  const [boss, setBoss] = useState<any>({
    id: 'boss',
    x: (BOSS_CONFIG.trajectory.X_MIN + BOSS_CONFIG.trajectory.X_MAX) / 2,
    y: BOSS_CONFIG.trajectory.Y_APPEAR, // старт вне поля
    speed: BOSS_CONFIG.speed,
    x0: (BOSS_CONFIG.trajectory.X_MIN + BOSS_CONFIG.trajectory.X_MAX) / 2,
    y0: BOSS_CONFIG.trajectory.Y_TARGET, // рабочая позиция по Y
    ampX: BOSS_CONFIG.trajectory.AMP_X,
    phaseX: BOSS_CONFIG.trajectory.PHASE_X,
    ampY: BOSS_CONFIG.trajectory.AMP_Y,
    phaseY: BOSS_CONFIG.trajectory.PHASE_Y,
    born: Date.now(),
  });
  const [bossHP, setBossHP] = useState(0);
  const [bossExists, setBossExists] = useState(false);
  const [bossPhase, setBossPhase] = useState<'idle' | 'active' | 'exploding' | 'defeated' | 'appearing'>('idle');
  const bossRef = useRef(boss);
  const bossHPRef = useRef(bossHP);
  const bossExistsRef = useRef(bossExists);
  const bossPhaseRef = useRef(bossPhase);
  useEffect(() => {
    bossRef.current = boss;
  }, [boss]);
  useEffect(() => {
    bossHPRef.current = bossHP;
  }, [bossHP]);
  useEffect(() => {
    bossExistsRef.current = bossExists;
  }, [bossExists]);
  useEffect(() => {
    bossPhaseRef.current = bossPhase;
  }, [bossPhase]);

  // Враги, астероиды, мины
  const [enemies, setEnemies] = useState<GameObject[]>([]);
  const [asteroids, setAsteroids] = useState<GameObject[]>([]);
  const [mines, setMines] = useState<GameObject[]>([]);

  // Снаряды
  const [playerLasers, setPlayerLasers] = useState<any[]>([]);
  const [playerRockets, setPlayerRockets] = useState<any[]>([]);
  const [enemyLasers, setEnemyLasers] = useState<any[]>([]);

  // HP
  const [enemyHP, setEnemyHP] = useState<{ [id: string]: number }>({});
  const [asteroidHP, setAsteroidHP] = useState<{ [id: string]: number }>({});
  const [mineHP, setMineHP] = useState<{ [id: string]: number }>({});

  // Ограничения движения
  const X_MIN = 0;
  const X_MAX = 100;
  const Y_MIN = 5;
  const Y_MAX = 60;

  // Рефы для координат игрока
  const playerXRef = useRef(playerX);
  const playerYRef = useRef(playerY);
  useEffect(() => {
    playerXRef.current = playerX;
  }, [playerX]);
  useEffect(() => {
    playerYRef.current = playerY;
  }, [playerY]);

  // Управление игроком
  const pressedKeys = useRef<{ [key: string]: boolean }>({});
  const PLAYER_MOVE = {
    accelX: GAME_CONFIG.PLAYER_ACCEL_X,
    accelY: GAME_CONFIG.PLAYER_ACCEL_Y,
    maxSpeedX: GAME_CONFIG.PLAYER_MAX_SPEED_X,
    maxSpeedY: GAME_CONFIG.PLAYER_MAX_SPEED_Y,
    frictionX: GAME_CONFIG.PLAYER_FRICTION_X,
    frictionY: GAME_CONFIG.PLAYER_FRICTION_Y,
  };
  const [playerVX, setPlayerVX] = useState(0);
  const [playerVY, setPlayerVY] = useState(0);

  // Рефы для актуальных данных
  const enemiesRef = useRef(enemies);
  const asteroidsRef = useRef(asteroids);
  const minesRef = useRef(mines);
  const playerLasersRef = useRef(playerLasers);
  const playerRocketsRef = useRef(playerRockets);
  const enemyLasersRef = useRef(enemyLasers);
  const enemyHPRef = useRef(enemyHP);
  const asteroidHPRef = useRef(asteroidHP);
  const mineHPRef = useRef(mineHP);
  const playerHPRef = useRef(playerHP);
  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);
  useEffect(() => {
    asteroidsRef.current = asteroids;
  }, [asteroids]);
  useEffect(() => {
    minesRef.current = mines;
  }, [mines]);
  useEffect(() => {
    playerLasersRef.current = playerLasers;
  }, [playerLasers]);
  useEffect(() => {
    playerRocketsRef.current = playerRockets;
  }, [playerRockets]);
  useEffect(() => {
    enemyLasersRef.current = enemyLasers;
  }, [enemyLasers]);
  useEffect(() => {
    enemyHPRef.current = enemyHP;
  }, [enemyHP]);
  useEffect(() => {
    asteroidHPRef.current = asteroidHP;
  }, [asteroidHP]);
  useEffect(() => {
    mineHPRef.current = mineHP;
  }, [mineHP]);
  useEffect(() => {
    playerHPRef.current = playerHP;
  }, [playerHP]);

  // Взрывы
  interface Explosion {
    id: string;
    x: number;
    y: number;
    type: 'enemy' | 'asteroid' | 'mine' | 'player' | 'boss';
    created: number;
  }
  const [explosions, setExplosions] = useState<Explosion[]>([]);

  // Частицы взрыва
  interface ExplosionParticle {
    id: string;
    x: number; // %
    y: number; // %
    vx: number; // %/frame
    vy: number;
    color: string;
    size: number;
    life: number; // ms
    created: number;
    type: 'enemy' | 'asteroid' | 'mine' | 'player' | 'boss';
  }
  const [explosionParticles, setExplosionParticles] = useState<ExplosionParticle[]>([]);

  // Мультипликатор скорости стрельбы
  const [fireRateMultiplier, setFireRateMultiplier] = useState(1);

  // Бустеры: теперь с полем appearAt и isActive
  const activatedBoostersCount = useRef(0);

  const [boosters, setBoosters] = useState<any[]>([]);
  const boostersRef = useRef(boosters);
  useEffect(() => {
    boostersRef.current = boosters;
  }, [boosters]);
  const [activeBooster, setActiveBooster] = useState(false);
  const boosterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Новый стейт для boosterAppearTimes, который обновляется при каждом запуске игры
  const [boosterAppearTimes, setBoosterAppearTimes] = useState<number[]>([]);

  // Пересчитываем boosterAppearTimes при каждом новом запуске игры
  useEffect(() => {
    if (showResults) return;
    // Берём актуальную длительность игры (секунды)
    const duration = GAME_CONFIG.GAME_DURATION;
    const minT = duration * 0.1;
    const maxT = duration * 0.9;
    const arr: number[] = [];
    for (let i = 0; i < BOOSTER_CONFIG.countPerGame; ++i) {
      arr.push(minT + Math.random() * (maxT - minT));
    }
    setBoosterAppearTimes(arr.sort((a, b) => a - b));
  }, [showResults]);

  // === Фон ===
  const [bgParams, setBgParams] = useState<any>(null);
  useEffect(() => {
    setBgParams(generateGameBgParams());
  }, []);
  const [backgroundOffset, setBackgroundOffset] = useState(0);
  useEffect(() => {
    if (!bgParams || showResults) return;
    let lastTime = Date.now();
    let running = true;
    function animate() {
      if (!running) return;
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setBackgroundOffset((prev) => (prev + backgroundScrollSpeed * dt * 100) % 100);
      requestAnimationFrame(animate);
    }
    animate();
    return () => {
      running = false;
    };
  }, [showResults, backgroundScrollSpeed, bgParams]);

  // === Управление игроком: непрерывное движение с ускорением ===
  // Состояние для нажатых клавиш
  // const pressedKeys = useRef<{ [key: string]: boolean }>({}) // УДАЛЕНО ДУБЛЬ
  // === ПАРАМЕТРЫ ДВИЖЕНИЯ ИГРОКА ===
  // const PLAYER_MOVE = { ... } // УДАЛЕНО ДУБЛЬ
  // const [playerVX, setPlayerVX] = useState(0) // УДАЛЕНО ДУБЛЬ
  // const [playerVY, setPlayerVY] = useState(0) // УДАЛЕНО ДУБЛЬ

  // === Рефы для актуальных данных ===
  // const enemiesRef = useRef(enemies) // УДАЛЕНО ДУБЛЬ
  // const asteroidsRef = useRef(asteroids) // УДАЛЕНО ДУБЛЬ
  // const minesRef = useRef(mines) // УДАЛЕНО ДУБЛЬ
  // const enemyHPRef = useRef(enemyHP) // УДАЛЕНО ДУБЛЬ
  // const asteroidHPRef = useRef(asteroidHP) // УДАЛЕНО ДУБЛЬ
  // const mineHPRef = useRef(mineHP) // УДАЛЕНО ДУБЛЬ
  // useEffect(() => { enemiesRef.current = enemies }, [enemies]) // УДАЛЕНО ДУБЛЬ
  // useEffect(() => { asteroidsRef.current = asteroids }, [asteroids]) // УДАЛЕНО ДУБЛЬ
  // useEffect(() => { minesRef.current = mines }, [mines]) // УДАЛЕНО ДУБЛЬ
  // useEffect(() => { enemyHPRef.current = enemyHP }, [enemyHP]) // УДАЛЕНО ДУБЛЬ
  // useEffect(() => { asteroidHPRef.current = asteroidHP }, [asteroidHP]) // УДАЛЕНО ДУБЛЬ
  // useEffect(() => { mineHPRef.current = mineHP }, [mineHP]) // УДАЛЕНО ДУБЛЬ

  // === Реф для playerHP ===
  // const playerHPRef = useRef(playerHP) // УДАЛЕНО ДУБЛЬ
  // useEffect(() => { playerHPRef.current = playerHP }, [playerHP]) // УДАЛЕНО ДУБЛЬ

  // === ВЗРЫВЫ ===
  // interface Explosion { ... } // Оставляем только одну декларацию
  // const [explosions, setExplosions] = useState<Explosion[]>([]) // УДАЛЕНО ДУБЛЬ

  // === ЧАСТИЦЫ ВЗРЫВА ===
  // interface ExplosionParticle { ... } // Оставляем только одну декларацию
  // const [explosionParticles, setExplosionParticles] = useState<ExplosionParticle[]>([]) // УДАЛЕНО ДУБЛЬ

  // === ЗВУКИ ===
  // Фоновая музыка и звуки событий
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Централизованные уровни громкости для всех игровых звуков.
   * Можно легко настраивать для каждого события.
   */
  const soundVolumes = {
    bgMusic: GAME_CONFIG.VOLUME_BG_MUSIC,
    playerLaser: GAME_CONFIG.VOLUME_PLAYER_LASER,
    playerRocket: GAME_CONFIG.VOLUME_PLAYER_ROCKET,
    enemyLaser: GAME_CONFIG.VOLUME_ENEMY_LASER,
    playerExplosion: GAME_CONFIG.VOLUME_PLAYER_EXPLOSION,
    enemyExplosion: GAME_CONFIG.VOLUME_ENEMY_EXPLOSION,
    asteroidExplosion: GAME_CONFIG.VOLUME_ASTEROID_EXPLOSION,
    mineExplosion: GAME_CONFIG.VOLUME_MINE_EXPLOSION,
    hitOnPlayer: GAME_CONFIG.VOLUME_PLAYER_HIT,
    hitOnEnemy: GAME_CONFIG.VOLUME_ENEMY_HIT,
    boosterActivate: GAME_CONFIG.VOLUME_BOOSTER_ACTIVATE,
  };

  // Универсальная функция для воспроизведения звуковых эффектов
  function playSound(src: string, volume = 0.5) {
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play();
    } catch (e) {
      console.warn('Ошибка воспроизведения звука', src, e);
    }
  }

  // Фоновая музыка — запускается при старте игры, останавливается при завершении
  useEffect(() => {
    if (showResults) {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
      }
      return;
    }

    if (!bgMusicRef.current) {
      bgMusicRef.current = new Audio(GAME_CONFIG.SOUND_BG_MUSIC);
      bgMusicRef.current.loop = true;
      bgMusicRef.current.volume = soundVolumes.bgMusic;
      bgMusicRef.current.play().catch(() => {});
    }

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
        bgMusicRef.current = null;
      }
    };
  }, [showResults, soundVolumes.bgMusic]);

  // Вспомогательная функция для генерации частиц
  function spawnExplosionParticles(x: number, y: number, type: 'enemy' | 'asteroid' | 'mine' | 'player' | 'boss') {
    let count = 16,
      colors: string[] = [],
      size = 3,
      speed = 0.5,
      life = 600;
    if (type === 'mine') {
      count = 14 + Math.floor(Math.random() * 4);
      colors = ['#ff9800', '#ffb300', '#ff5722', '#fff176'];
      size = 3;
      speed = 0.5;
    } else if (type === 'asteroid') {
      count = 16 + Math.floor(Math.random() * 4);
      colors = ['#fff', '#e0e0e0', '#bdbdbd', '#757575'];
      size = 3;
      speed = 0.4;
    } else if (type === 'enemy') {
      count = 16 + Math.random() * 4;
      colors = ['#39ff14', '#baffc9', '#00ff99', '#00ffc3'];
      size = 3;
      speed = 0.5;
    } else if (type === 'player') {
      count = 28 + Math.floor(Math.random() * 6);
      colors = ['#fff200', '#ff9800', '#ff3d00', '#fff', '#ffd600'];
      size = 6;
      speed = 0.8;
      life = 700;
    } else if (type === 'boss') {
      count = 64 + Math.floor(Math.random() * 32);
      colors = ['#ff1744', '#ffea00', '#00e5ff', '#fff', '#ff9100', '#00ffea', '#ff4081'];
      size = 12;
      speed = 1.2;
      life = 1200;
    }
    const now = Date.now();
    const particles: ExplosionParticle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count + Math.random() * ((Math.PI * 2) / count);
      const v = speed * (0.7 + Math.random() * 0.7);
      particles.push({
        id: `${type}_part_${Math.random().toString(36).slice(2)}`,
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: size + Math.random() * (type === 'boss' ? 10 : type === 'player' ? 3 : 2),
        life,
        created: now,
        type,
      });
    }
    setExplosionParticles((prev) => [...prev, ...particles]);
  }

  // Анимация частиц
  useEffect(() => {
    if (!explosionParticles.length) return;
    let running = true;
    function animate() {
      setExplosionParticles((prev) =>
        prev
          .map((p) => {
            // Обновляем позицию
            let nx = p.x + p.vx;
            let ny = p.y + p.vy;
            // let nvy = p.vy + 0.04; // убираем гравитацию
            // Ограничиваем в пределах 0-100%
            if (nx < 0) nx = 0;
            if (nx > 100) nx = 100;
            if (ny < 0) ny = 0;
            if (ny > 100) ny = 100;
            return { ...p, x: nx, y: ny };
          })
          .filter((p) => Date.now() - p.created < p.life),
      );
      if (running && explosionParticles.length) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    return () => {
      running = false;
    };
  }, [explosionParticles.length]);

  // Вспомогательная функция для взрыва и звука
  function spawnExplosion(x: number, y: number, type: 'enemy' | 'asteroid' | 'mine' | 'player' | 'boss') {
    // Корректируем позицию взрыва для визуального центра объекта
    const cx = x;
    let cy = y;
    if (type === 'enemy') cy = y + 2.5;
    else if (type === 'asteroid') cy = y + 2.5;
    else if (type === 'mine') cy = y + 1.5;
    else if (type === 'player') cy = y + 3;
    setExplosions((prev) => [
      ...prev,
      { id: `${type}_expl_${Math.random().toString(36).slice(2)}`, x: cx, y: cy, type, created: Date.now() },
    ]);
    spawnExplosionParticles(cx, cy, type);
    // Воспроизведение звука взрыва
    if (type === 'enemy') playSound(GAME_CONFIG.SOUND_ENEMY_EXPLOSION, soundVolumes.enemyExplosion);
    else if (type === 'asteroid') playSound(GAME_CONFIG.SOUND_ASTEROID_EXPLOSION, soundVolumes.asteroidExplosion);
    else if (type === 'mine') playSound(GAME_CONFIG.SOUND_MINE_EXPLOSION, soundVolumes.mineExplosion);
    else if (type === 'player') playSound(GAME_CONFIG.SOUND_PLAYER_EXPLOSION, soundVolumes.playerExplosion);
  }

  // Очищаем старые взрывы
  useEffect(() => {
    if (!explosions.length) return;
    const interval = setInterval(() => {
      setExplosions((prev) => prev.filter((e) => Date.now() - e.created < 600));
    }, 200);
    return () => clearInterval(interval);
  }, [explosions.length]);

  // Таймер игры: каждую секунду уменьшаем gameTime
  useEffect(() => {
    if (showResults) return; // Не продолжаем таймер, если игра завершена
    if (gameTime === 0) return; // Не продолжаем, если время вышло
    const timer = setInterval(() => {
      setGameTime((prev: number) => {
        if (prev > 0) return prev - 1;
        return 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameTime, showResults]);

  // Проверка завершения игры: по времени или по жизням
  useEffect(() => {
    if (showResults) return;
    // Если игрок погиб — поражение
    if (playerHP === 0) {
      setIsVictory(false);
      setTimeout(() => {
        setShowResults(true);
      }, 2000);
      return;
    }
    // Если время вышло, но босс ещё не побеждён — ничего не делаем, ждём фазу босса
    // Victory наступает только после bossPhase === 'exploding' (см. отдельный useEffect)
  }, [gameTime, playerHP, showResults]);

  // Обработка нажатий и отпусканий клавиш
  useEffect(() => {
    if (showResults) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        pressedKeys.current[e.key] = true;
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        pressedKeys.current[e.key] = false;
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [showResults]);

  // Основной цикл движения игрока с ускорением
  useEffect(() => {
    if (showResults || !playerExists) return;
    const interval = setInterval(() => {
      let vx = playerVX;
      let vy = playerVY;
      // Управление ускорением
      if (pressedKeys.current['ArrowLeft']) {
        vx = Math.max(vx - PLAYER_MOVE.accelX, -PLAYER_MOVE.maxSpeedX);
      } else if (pressedKeys.current['ArrowRight']) {
        vx = Math.min(vx + PLAYER_MOVE.accelX, PLAYER_MOVE.maxSpeedX);
      } else {
        // Торможение по X
        if (vx > 0) vx = Math.max(0, vx - PLAYER_MOVE.frictionX);
        if (vx < 0) vx = Math.min(0, vx + PLAYER_MOVE.frictionX);
      }
      if (pressedKeys.current['ArrowUp']) {
        vy = Math.min(vy + PLAYER_MOVE.accelY, PLAYER_MOVE.maxSpeedY);
      } else if (pressedKeys.current['ArrowDown']) {
        vy = Math.max(vy - PLAYER_MOVE.accelY, -PLAYER_MOVE.maxSpeedY);
      } else {
        // Торможение по Y
        if (vy > 0) vy = Math.max(0, vy - PLAYER_MOVE.frictionY);
        if (vy < 0) vy = Math.min(0, vy + PLAYER_MOVE.frictionY);
      }
      // Обновляем скорости
      setPlayerVX(vx);
      setPlayerVY(vy);
      // Обновляем позицию игрока
      setPlayerX((prev) => Math.max(X_MIN, Math.min(X_MAX, prev + vx)));
      setPlayerY((prev) => Math.max(Y_MIN, Math.min(Y_MAX, prev + vy)));
    }, 16); // ~60 FPS
    return () => clearInterval(interval);
  }, [showResults, playerVX, playerVY, playerExists]);

  // При завершении игры сбрасываем скорости и клавиши
  useEffect(() => {
    if (showResults) {
      setPlayerVX(0);
      setPlayerVY(0);
      pressedKeys.current = {};
    }
  }, [showResults]);

  // === ПАРАМЕТРЫ КОРАБЛЯ ПО УРОВНЯМ ===
  const SHIP_LEVELS = GAME_CONFIG.SHIP_LEVELS;
  const safeLevel = Math.max(1, Math.min(10, shipLevel || 1));
  const params = React.useMemo(() => SHIP_LEVELS[safeLevel] || SHIP_LEVELS[1], [safeLevel]);
  const bossParams = params.boss;

  // Генерация врагов
  useEffect(() => {
    if (showResults || bossExists) return;
    const interval = setInterval(() => {
      const cfg = GAME_CONFIG.ENEMY_TRAJECTORY_CONFIG;
      const id = `enemy_${Math.random().toString(36).slice(2)}`;
      // Используем параметры из конфига
      const x0 = cfg.X0_MIN + Math.random() * (cfg.X0_MAX - cfg.X0_MIN); // стартовая X
      const ampX = cfg.AMP_X_MIN + Math.random() * (cfg.AMP_X_MAX - cfg.AMP_X_MIN); // амплитуда X
      const phaseX = cfg.PHASE_X_MIN + Math.random() * (cfg.PHASE_X_MAX - cfg.PHASE_X_MIN); // фаза X
      const ampY = cfg.AMP_Y_MIN + Math.random() * (cfg.AMP_Y_MAX - cfg.AMP_Y_MIN); // амплитуда Y
      const phaseY = cfg.PHASE_Y_MIN + Math.random() * (cfg.PHASE_Y_MAX - cfg.PHASE_Y_MIN); // фаза Y
      setEnemies((prev) => [
        ...prev,
        {
          id,
          x: x0,
          y: 100, // сверху
          speed:
            GAME_CONFIG.ENEMY_SPEED_MIN + Math.random() * (GAME_CONFIG.ENEMY_SPEED_MAX - GAME_CONFIG.ENEMY_SPEED_MIN), // скорость вниз
          x0,
          y0: 100,
          ampX,
          phaseX,
          ampY,
          phaseY,
          born: Date.now(),
        },
      ]);
      setEnemyHP((prev) => ({ ...prev, [id]: GAME_CONFIG.ENEMY_BASE_HP }));
    }, params.enemyInterval);
    return () => clearInterval(interval);
  }, [showResults, params.enemyInterval, bossExists]);

  // Генерация астероидов
  useEffect(() => {
    if (showResults) return;
    const interval = setInterval(() => {
      const id = `asteroid_${Math.random().toString(36).slice(2)}`;
      setAsteroids((prev) => [
        ...prev,
        {
          id,
          x: Math.random() * 90, // стартовая X (0-90%)
          y: 100, // сверху
          speed: ASTEROID_SPEED_MIN + Math.random() * (ASTEROID_SPEED_MAX - ASTEROID_SPEED_MIN), // скорость вниз
          rotation: Math.random() * 360, // начальный угол
          // rotationSpeed теперь из GAME_CONFIG
          rotationSpeed:
            GAME_CONFIG.ASTEROID_ROTATION_SPEED_MIN +
            Math.random() * (GAME_CONFIG.ASTEROID_ROTATION_SPEED_MAX - GAME_CONFIG.ASTEROID_ROTATION_SPEED_MIN),
        },
      ]);
      setAsteroidHP((prev) => ({ ...prev, [id]: GAME_CONFIG.ASTEROID_BASE_HP }));
    }, params.asteroidInterval);
    return () => clearInterval(interval);
  }, [showResults, params.asteroidInterval]);

  // Генерация мин
  useEffect(() => {
    if (showResults || bossExists) return;
    const interval = setInterval(() => {
      const id = `mine_${Math.random().toString(36).slice(2)}`;
      setMines((prev) => [
        ...prev,
        {
          id,
          x: Math.random() * 90 + 5, // стартовая X (5-95%)
          y: 100, // сверху
          speed: MINE_SPEED, // скорость вниз
        },
      ]);
      setMineHP((prev) => ({ ...prev, [id]: GAME_CONFIG.MINE_BASE_HP }));
    }, params.mineInterval);
    return () => clearInterval(interval);
  }, [showResults, params.mineInterval, bossExists]);

  // === СЧЁТЧИКИ УНИЧТОЖЕННЫХ ===
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [asteroidsKilled, setAsteroidsKilled] = useState(0);
  const [minesKilled, setMinesKilled] = useState(0);

  // === СТРЕЛЬБА ИГРОКА: только один useEffect, не зависит от координат ===
  // Стрельба (лазеры и ракеты) инициируется только этим эффектом, строго по таймеру, без дублирования.
  useEffect(() => {
    if (showResults || !playerExists) return;
    const laserCount = params.lasers || 1;
    const rocketCount = params.rockets || 1;
    const laserInterval = setInterval(
      () => {
        setPlayerLasers((prev) => [
          ...prev,
          ...Array.from({ length: laserCount }).map((_, i) => {
            const spread = 7 * (laserCount > 1 ? i - (laserCount - 1) / 2 : 0);
            return {
              id: `laser_${Math.random().toString(36).slice(2)}`,
              x: playerXRef.current + spread,
              y: playerYRef.current + GAME_CONFIG.PLAYER_LASER_SPEED,
              type: 'laser',
            };
          }),
        ]);
        playSound(GAME_CONFIG.SOUND_PLAYER_LASER, soundVolumes.playerLaser);
      },
      (params.laserRate ?? 1000) * fireRateMultiplier,
    );
    const rocketInterval = setInterval(
      () => {
        setPlayerRockets((prev) => [
          ...prev,
          ...Array.from({ length: rocketCount }).map(() => ({
            id: `rocket_${Math.random().toString(36).slice(2)}`,
            x: playerXRef.current,
            y: playerYRef.current + GAME_CONFIG.PLAYER_ROCKET_SPEED,
            type: 'rocket',
          })),
        ]);
        playSound(GAME_CONFIG.SOUND_PLAYER_ROCKET, soundVolumes.playerRocket);
      },
      (params.rocketRate ?? 2000) * fireRateMultiplier,
    );
    return () => {
      clearInterval(laserInterval);
      clearInterval(rocketInterval);
    };
  }, [showResults, playerExists, fireRateMultiplier, params]);

  // === СТРЕЛЬБА ВРАГОВ ===
  useEffect(() => {
    if (showResults || !playerExists) return;
    const interval = setInterval(() => {
      // Используем минимальный Y для стрельбы из конфига
      const shooters = enemiesRef.current.filter((enemy) => enemy.y > GAME_CONFIG.ENEMY_FIRE_Y_MIN);
      if (shooters.length > 0) {
        setEnemyLasers((prev) => [
          ...prev,
          ...shooters.map((enemy) => {
            // Вычисляем нормализованный вектор направления к игроку
            const dx = playerXRef.current - enemy.x;
            const dy = playerYRef.current - enemy.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const vx = (dx / len) * GAME_CONFIG.ENEMY_LASER_SPEED;
            const vy = (dy / len) * GAME_CONFIG.ENEMY_LASER_SPEED;
            return {
              id: `enemyLaser_${enemy.id}_${Math.random().toString(36).slice(2)}`,
              x: enemy.x,
              y: enemy.y,
              type: 'enemyLaser',
              vx,
              vy,
              t: 0,
            };
          }),
        ]);
        // Проигрываем звук только если есть стреляющие враги
        playSound(GAME_CONFIG.SOUND_ENEMY_LASER, soundVolumes.enemyLaser);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [showResults, playerExists]);

  // === Защита от множественных игровых циклов ===
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  // === ЕДИНЫЙ GAME LOOP: движение, столкновения, урон, уничтожение, подсчёты ===
  // Вся игровая логика (движение объектов, столкновения, урон, уничтожение, подсчёты) происходит только здесь.
  // Никаких других setInterval/useEffect для движения/столкновений быть не должно!
  useEffect(() => {
    if (showResults) return;
    let lastTime = Date.now();

    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    gameLoopRef.current = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      // === ДВИЖЕНИЕ и СТОЛКНОВЕНИЯ ===
      // --- Берём только актуальные значения из useRef ---
      let newEnemies = [...enemiesRef.current];
      let newAsteroids = [...asteroidsRef.current];
      let newMines = [...minesRef.current];
      let newPlayerLasers = [...playerLasersRef.current];
      let newPlayerRockets = [...playerRocketsRef.current];
      let newEnemyLasers = [...enemyLasersRef.current];
      const newEnemyHP = { ...enemyHPRef.current };
      const newAsteroidHP = { ...asteroidHPRef.current };
      const newMineHP = { ...mineHPRef.current };
      let playerWasHit = false;
      let playerHPNow = playerHPRef.current;
      let enemiesKilledNow = 0;
      let asteroidsKilledNow = 0;
      let minesKilledNow = 0;
      const newBoosters = [...boostersRef.current];
      // === ДВИЖЕНИЕ ОБЪЕКТОВ (восстановлено) ===
      // Враги
      newEnemies = newEnemies
        .map((enemy) => ({
          ...enemy,
          y: enemy.y - (enemy.speed || 0) * dt,
          // Используем частоту синусоиды из конфига
          x:
            (enemy.x0 ?? 0) +
            (enemy.ampX || 0) *
              Math.sin(
                ((Date.now() - (enemy.born || 0)) / 1000) * GAME_CONFIG.ENEMY_TRAJECTORY_CONFIG.SIN_FREQ +
                  (enemy.phaseX || 0),
              ),
        }))
        .filter((enemy) => enemy.y > -10);
      // Астероиды
      newAsteroids = newAsteroids
        .map((ast) => ({
          ...ast,
          y: ast.y - (ast.speed || 0) * dt,
          rotation: (ast.rotation || 0) + (ast.rotationSpeed || 0) * dt,
        }))
        .filter((ast) => ast.y > -10);
      // Мины
      newMines = newMines
        .map((mine) => ({
          ...mine,
          y: mine.y - (mine.speed || 0) * dt,
        }))
        .filter((mine) => mine.y > -10);
      // Лазеры игрока
      newPlayerLasers = newPlayerLasers
        .map((laser) => ({ ...laser, y: laser.y + GAME_CONFIG.PLAYER_LASER_SPEED }))
        .filter((laser) => laser.y < 110);
      // Ракеты игрока
      newPlayerRockets = newPlayerRockets
        .map((rocket) => ({ ...rocket, y: rocket.y + GAME_CONFIG.PLAYER_ROCKET_SPEED }))
        .filter((rocket) => rocket.y < 110);
      // Лазеры врагов и босса (теперь bossLaser и bossRocket используют vx/vy)
      newEnemyLasers = newEnemyLasers
        .map((laser) => {
          if (laser.type === 'enemyLaser' || laser.type === 'bossLaser' || laser.type === 'bossRocket') {
            return { ...laser, x: laser.x + (laser.vx || 0), y: laser.y + (laser.vy || 0) };
          }
          return laser;
        })
        .filter((laser) => laser.y > -10 && laser.y < 110);

      // === ДВИЖЕНИЕ БОССА ===
      if (
        bossExistsRef.current &&
        (bossPhaseRef.current === 'active' || bossPhaseRef.current === 'appearing') &&
        bossRef.current
      ) {
        const t = (Date.now() - (bossRef.current.born || 0)) / 1000;
        // === Анимация появления ===
        if (bossPhaseRef.current === 'appearing') {
          // Плавно двигаем по Y к целевой позиции
          const yNow = bossRef.current.y;
          const yTarget = BOSS_CONFIG.trajectory.Y_TARGET;
          const appearSpeed = BOSS_CONFIG.trajectory.APPEAR_SPEED * dt; // %/сек
          let newY = yNow + appearSpeed;
          let newBossObj = { ...bossRef.current };
          if (newY >= yTarget) {
            newY = yTarget;
            // Фиксируем x0/y0, сбрасываем фазы и born (для плавного старта синусоиды)
            newBossObj = {
              ...bossRef.current,
              y: newY,
              x0: bossRef.current.x,
              y0: newY,
              phaseX: 0,
              phaseY: 0,
              born: Date.now(), // сброс времени для t=0
            };
            setBossPhase('active');
          } else {
            newBossObj = { ...bossRef.current, y: newY };
          }
          setBoss(newBossObj);
        } else {
          // === Обычная траектория ===
          // Y: синусоида вокруг y0
          const yAmp = BOSS_CONFIG.trajectory.AMP_Y;
          const newY =
            (bossRef.current.y0 ?? BOSS_CONFIG.trajectory.Y_TARGET) +
            yAmp * Math.sin(t * BOSS_CONFIG.trajectory.SIN_FREQ + (bossRef.current.phaseY || 0));
          // X: синусоида вокруг x0
          const xAmp = BOSS_CONFIG.trajectory.AMP_X;
          const newX =
            (bossRef.current.x0 ?? (BOSS_CONFIG.trajectory.X_MIN + BOSS_CONFIG.trajectory.X_MAX) / 2) +
            xAmp * Math.sin(t * BOSS_CONFIG.trajectory.SIN_FREQ + (bossRef.current.phaseX || 0));
          setBoss({ ...bossRef.current, x: newX, y: newY });
        }
      }
      // === СТОЛКНОВЕНИЯ: ЛАЗЕРЫ ИГРОКА ===
      for (let i = newPlayerLasers.length - 1; i >= 0; i--) {
        const laser = newPlayerLasers[i];
        // --- Босс ---
        if (bossExistsRef.current && bossPhaseRef.current === 'active' && bossRef.current) {
          if (
            Math.abs(laser.x - bossRef.current.x) < BOSS_CONFIG.hitbox &&
            Math.abs(laser.y - bossRef.current.y) < BOSS_CONFIG.hitbox
          ) {
            setBossHP((prev) => Math.max(0, prev - 1));
            newPlayerLasers.splice(i, 1);
            // Если HP босса <= 0, запускаем фазу взрыва
            if (bossHPRef.current - 1 <= 0) {
              setBossPhase('exploding');
            }
            continue;
          }
        }
        // Враги
        for (let j = 0; j < newEnemies.length; j++) {
          const enemy = newEnemies[j];
          if (Math.abs(laser.x - enemy.x) < PLAYER_HITBOX && Math.abs(laser.y - enemy.y) < PLAYER_HITBOX) {
            newEnemyHP[enemy.id] = (newEnemyHP[enemy.id] || 1) - 1;
            if (newEnemyHP[enemy.id] <= 0) {
              spawnExplosion(enemy.x, enemy.y, 'enemy');
              newEnemies.splice(j, 1);
              delete newEnemyHP[enemy.id];
              enemiesKilledNow++;
              setPtsEarned((prev) => prev + GAME_CONFIG.ENEMY_REWARD);
              playSound(GAME_CONFIG.SOUND_ENEMY_EXPLOSION, soundVolumes.enemyExplosion);
            } else {
              playSound(GAME_CONFIG.SOUND_ENEMY_HIT, soundVolumes.hitOnEnemy);
            }
            newPlayerLasers.splice(i, 1);
            break;
          }
        }
        // Астероиды
        for (let j = 0; j < newAsteroids.length; j++) {
          const ast = newAsteroids[j];
          if (Math.abs(laser.x - ast.x) < ASTEROID_HITBOX && Math.abs(laser.y - ast.y) < ASTEROID_HITBOX) {
            newAsteroidHP[ast.id] = (newAsteroidHP[ast.id] || 1) - 1;
            if (newAsteroidHP[ast.id] <= 0) {
              spawnExplosion(ast.x, ast.y, 'asteroid');
              newAsteroids.splice(j, 1);
              delete newAsteroidHP[ast.id];
              asteroidsKilledNow++;
              setPtsEarned((prev) => prev + GAME_CONFIG.ASTEROID_REWARD);
              playSound(GAME_CONFIG.SOUND_ASTEROID_EXPLOSION, soundVolumes.asteroidExplosion);
            } else {
              playSound(GAME_CONFIG.SOUND_ENEMY_HIT, soundVolumes.hitOnEnemy);
            }
            newPlayerLasers.splice(i, 1);
            break;
          }
        }
        // Мины
        for (let j = 0; j < newMines.length; j++) {
          const mine = newMines[j];
          if (Math.abs(laser.x - mine.x) < MINE_HITBOX && Math.abs(laser.y - mine.y) < MINE_HITBOX) {
            newMineHP[mine.id] = (newMineHP[mine.id] || 1) - 1;
            if (newMineHP[mine.id] <= 0) {
              spawnExplosion(mine.x, mine.y, 'mine');
              newMines.splice(j, 1);
              delete newMineHP[mine.id];
              minesKilledNow++;
              setPtsEarned((prev) => prev + GAME_CONFIG.MINE_REWARD);
              playSound(GAME_CONFIG.SOUND_MINE_EXPLOSION, soundVolumes.mineExplosion);
            }
            newPlayerLasers.splice(i, 1);
            break;
          }
        }
      }
      // === СТОЛКНОВЕНИЯ: РАКЕТЫ ИГРОКА ===
      for (let i = newPlayerRockets.length - 1; i >= 0; i--) {
        const rocket = newPlayerRockets[i];
        let hit = false;
        // --- Босс ---
        if (bossExistsRef.current && bossPhaseRef.current === 'active' && bossRef.current) {
          if (
            Math.abs(rocket.x - bossRef.current.x) < BOSS_CONFIG.hitbox &&
            Math.abs(rocket.y - bossRef.current.y) < BOSS_CONFIG.hitbox
          ) {
            setBossHP((prev) => Math.max(0, prev - 3));
            // Если HP босса <= 3, запускаем фазу взрыва
            if (bossHPRef.current - 3 <= 0) {
              setBossPhase('exploding');
            }
            newPlayerRockets.splice(i, 1);
            continue;
          }
        }
        // Враги
        for (let j = 0; j < newEnemies.length; j++) {
          const enemy = newEnemies[j];
          if (Math.abs(rocket.x - enemy.x) < PLAYER_HITBOX && Math.abs(rocket.y - enemy.y) < PLAYER_HITBOX) {
            newEnemyHP[enemy.id] = (newEnemyHP[enemy.id] || 1) - 3;
            if (newEnemyHP[enemy.id] <= 0) {
              spawnExplosion(enemy.x, enemy.y, 'enemy');
              newEnemies.splice(j, 1);
              delete newEnemyHP[enemy.id];
              enemiesKilledNow++;
              setPtsEarned((prev) => prev + GAME_CONFIG.ENEMY_REWARD);
              playSound(GAME_CONFIG.SOUND_ENEMY_EXPLOSION, soundVolumes.enemyExplosion);
            } else {
              playSound(GAME_CONFIG.SOUND_ENEMY_HIT, soundVolumes.hitOnEnemy);
            }
            newPlayerRockets.splice(i, 1);
            hit = true;
            break;
          }
        }
        // Астероиды
        for (let j = 0; j < newAsteroids.length; j++) {
          const ast = newAsteroids[j];
          if (Math.abs(rocket.x - ast.x) < ASTEROID_HITBOX && Math.abs(rocket.y - ast.y) < ASTEROID_HITBOX) {
            spawnExplosion(ast.x, ast.y, 'asteroid');
            newAsteroids.splice(j, 1);
            delete newAsteroidHP[ast.id];
            asteroidsKilledNow++;
            setPtsEarned((prev) => prev + GAME_CONFIG.ASTEROID_REWARD);
            playSound(GAME_CONFIG.SOUND_ASTEROID_EXPLOSION, soundVolumes.asteroidExplosion);
            hit = true;
            break;
          }
        }
        // Мины
        for (let j = 0; j < newMines.length; j++) {
          const mine = newMines[j];
          if (Math.abs(rocket.x - mine.x) < MINE_HITBOX && Math.abs(rocket.y - mine.y) < MINE_HITBOX) {
            spawnExplosion(mine.x, mine.y, 'mine');
            newMines.splice(j, 1);
            delete newMineHP[mine.id];
            minesKilledNow++;
            setPtsEarned((prev) => prev + GAME_CONFIG.MINE_REWARD);
            playSound(GAME_CONFIG.SOUND_MINE_EXPLOSION, soundVolumes.mineExplosion);
            hit = true;
            break;
          }
        }
        if (hit) newPlayerRockets.splice(i, 1);
      }
      // === СТОЛКНОВЕНИЯ: ВРАГИ/АСТЕРОИДЫ/МИНЫ С ИГРОКОМ ===
      if (playerExists && playerHPNow > 0) {
        // Враги
        for (let i = newEnemies.length - 1; i >= 0; i--) {
          const enemy = newEnemies[i];
          if (
            Math.abs(enemy.x - playerXRef.current) < PLAYER_HITBOX + ENEMY_HITBOX &&
            Math.abs(enemy.y - playerYRef.current) < PLAYER_HITBOX + ENEMY_HITBOX
          ) {
            playerWasHit = true;
            playerHPNow = Math.max(0, playerHPNow - 1);
            spawnExplosion(enemy.x, enemy.y, 'enemy');
            newEnemies.splice(i, 1);
            delete newEnemyHP[enemy.id];
            enemiesKilledNow++;
            setPtsEarned((prev) => prev + GAME_CONFIG.ENEMY_REWARD);
            if (playerHPNow > 0) {
              playSound(GAME_CONFIG.SOUND_PLAYER_HIT, soundVolumes.hitOnPlayer);
            }
          }
        }
        // Астероиды
        for (let i = newAsteroids.length - 1; i >= 0; i--) {
          const ast = newAsteroids[i];
          if (
            Math.abs(ast.x - playerXRef.current) < PLAYER_HITBOX + ASTEROID_HITBOX &&
            Math.abs(ast.y - playerYRef.current) < PLAYER_HITBOX + ASTEROID_HITBOX
          ) {
            playerWasHit = true;
            playerHPNow = Math.max(0, playerHPNow - 1);
            spawnExplosion(ast.x, ast.y, 'asteroid');
            newAsteroids.splice(i, 1);
            delete newAsteroidHP[ast.id];
            asteroidsKilledNow++;
            setPtsEarned((prev) => prev + GAME_CONFIG.ASTEROID_REWARD);
            if (playerHPNow > 0) {
              playSound(GAME_CONFIG.SOUND_PLAYER_HIT, soundVolumes.hitOnPlayer);
            }
          }
        }
        // Мины
        for (let i = newMines.length - 1; i >= 0; i--) {
          const mine = newMines[i];
          if (
            Math.abs(mine.x - playerXRef.current) < PLAYER_HITBOX + MINE_HITBOX &&
            Math.abs(mine.y - playerYRef.current) < PLAYER_HITBOX + MINE_HITBOX
          ) {
            playerWasHit = true;
            playerHPNow = Math.max(0, playerHPNow - 1);
            spawnExplosion(mine.x, mine.y, 'mine');
            newMines.splice(i, 1);
            delete newMineHP[mine.id];
            minesKilledNow++;
            setPtsEarned((prev) => prev + GAME_CONFIG.MINE_REWARD);
            if (playerHPNow > 0) {
              playSound(GAME_CONFIG.SOUND_PLAYER_HIT, soundVolumes.hitOnPlayer);
            }
          }
        }
        // Лазеры врагов
        for (let i = newEnemyLasers.length - 1; i >= 0; i--) {
          const laser = newEnemyLasers[i];
          // --- Лазеры и ракеты босса ---
          if (laser.type === 'bossLaser') {
            if (
              Math.abs(laser.x - playerXRef.current) < PLAYER_HITBOX &&
              Math.abs(laser.y - playerYRef.current) < PLAYER_HITBOX
            ) {
              playerWasHit = true;
              playerHPNow = Math.max(0, playerHPNow - 1);
              newEnemyLasers.splice(i, 1);
              // playSound(BOSS_CONFIG.soundLaser, 0.8); // [FIX] Убрано: звук выстрела босса должен проигрываться только при выстреле, а не при попадании
              continue;
            }
          } else if (laser.type === 'bossRocket') {
            if (
              Math.abs(laser.x - playerXRef.current) < PLAYER_HITBOX + 2 &&
              Math.abs(laser.y - playerYRef.current) < PLAYER_HITBOX + 2
            ) {
              playerWasHit = true;
              playerHPNow = Math.max(0, playerHPNow - 3);
              newEnemyLasers.splice(i, 1);
              playSound(BOSS_CONFIG.soundRocket, 0.9);
              continue;
            }
          } else if (laser.type === 'enemyLaser') {
            if (
              Math.abs(laser.x - playerXRef.current) < PLAYER_HITBOX &&
              Math.abs(laser.y - playerYRef.current) < PLAYER_HITBOX
            ) {
              playerWasHit = true;
              playerHPNow = Math.max(0, playerHPNow - 1);
              newEnemyLasers.splice(i, 1);
              if (playerHPNow > 0) {
                playSound(GAME_CONFIG.SOUND_PLAYER_HIT, soundVolumes.hitOnPlayer);
              }
            }
          }
        }
      }

      // === ОБНОВЛЯЕМ СОСТОЯНИЯ ===
      setEnemies(newEnemies);
      setAsteroids(newAsteroids);
      setMines(newMines);
      setPlayerLasers(newPlayerLasers);
      setPlayerRockets(newPlayerRockets);
      setEnemyLasers(newEnemyLasers);
      setEnemyHP(newEnemyHP);
      setAsteroidHP(newAsteroidHP);
      setMineHP(newMineHP);
      setBoosters(newBoosters); // Обновляем состояние бустеров
      if (playerWasHit) setPlayerHP(playerHPNow);
      // === ВЗРЫВ ИГРОКА ПРИ СМЕРТИ ===
      if (playerWasHit && playerHPNow === 0 && playerExists) {
        // Визуальный и звуковой взрыв игрока
        spawnExplosion(playerXRef.current, playerYRef.current, 'player');
        setPlayerExists(false); // Скрываем игрока после взрыва
      }
      if (enemiesKilledNow) setEnemiesKilled((prev) => prev + enemiesKilledNow);
      if (asteroidsKilledNow) setAsteroidsKilled((prev) => prev + asteroidsKilledNow);
      if (minesKilledNow) setMinesKilled((prev) => prev + minesKilledNow);
    }, 30);
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [showResults, boss, bossExists, bossPhase, bossHP]);

  // Форматирование времени для HUD
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Логирование монтирования/размонтирования компонента
  useEffect(() => {
    console.log('[InGameScreen] mounted');
    return () => {
      console.log('[InGameScreen] unmounted');
    };
  }, []);

  useEffect(() => {
    console.log(`[PTS] Total updated: ${ptsEarned}`);
  }, [ptsEarned]);

  // === ПАРАМЕТРЫ ФОНА ===
  // УДАЛЕНО ДУБЛЬ:
  // const [bgParams, setBgParams] = useState<any>(null);
  // useEffect(() => { setBgParams(generateGameBgParams()); }, []);
  // useEffect(() => { ... }, [showResults, backgroundScrollSpeed, bgParams]);
  // if (!bgParams) return null;

  // Генерируем фон только на клиенте после монтирования (SSR-safe)
  // const [bgParams, setBgParams] = useState<any>(null);
  // useEffect(() => {
  //   setBgParams(generateGameBgParams());
  // }, []);

  // === АНИМАЦИЯ ДВИЖЕНИЯ ФОНА ===
  useEffect(() => {
    if (!bgParams || showResults) return;
    let lastTime = Date.now();
    let running = true;
    function animate() {
      if (!running) return;
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setBackgroundOffset((prev) => (prev + backgroundScrollSpeed * dt * 100) % 100);
      requestAnimationFrame(animate);
    }
    animate();
    return () => {
      running = false;
    };
  }, [showResults, backgroundScrollSpeed, bgParams]);

  // === КОНСТАНТЫ HITBOX (в процентах поля, как раньше) ===
  const PLAYER_HITBOX = GAME_CONFIG.PLAYER_HITBOX_SIZE; // Увеличен с 3.5 для соответствия размеру спрайта 56px
  const ENEMY_HITBOX = GAME_CONFIG.ENEMY_HITBOX_SIZE; // Увеличен с 3.0 для соответствия размеру спрайта 48px
  const ASTEROID_HITBOX = GAME_CONFIG.ASTEROID_HITBOX_SIZE; // Увеличен с 3.0 для соответствия размерам 20-48px
  const MINE_HITBOX = GAME_CONFIG.MINE_HITBOX_SIZE; // Увеличен с 2.5 для соответствия размеру спрайта 36px
  const BOOSTER_HITBOX = BOOSTER_CONFIG.hitboxSize;

  // === Летящие бустеры ===
  // const [boosters, setBoosters] = useState<any[]>([]); // УДАЛЕНО ДУБЛЬ
  // const [activeBooster, setActiveBooster] = useState(false); // УДАЛЕНО ДУБЛЬ
  // const [boosterAura, setBoosterAura] = useState(false); // УДАЛЕНО ДУБЛЬ
  // const boosterTimeoutRef = useRef<NodeJS.Timeout | null>(null); // УДАЛЕНО ДУБЛЬ
  // === МУЛЬТИПЛИКАТОР СКОРОСТИ СТРЕЛЬБЫ ===
  // const [fireRateMultiplier, setFireRateMultiplier] = useState(1); // УДАЛЕНО ДУБЛЬ

  // Активация бустера (общая для подбора и кнопки)
  function activateBooster() {
    if (activeBooster) return;

    playSound(BOOSTER_CONFIG.soundActivate, soundVolumes.boosterActivate);
    setActiveBooster(true);
    // Ускоряем стрельбу (в два раза уменьшаем интервалы)
    setFireRateMultiplier(0.5);
    if (boosterTimeoutRef.current) clearTimeout(boosterTimeoutRef.current);
    boosterTimeoutRef.current = setTimeout(() => {
      setActiveBooster(false);
      setFireRateMultiplier(1);
    }, BOOSTER_CONFIG.effectDuration);
  }

  function handleActivateBoosterByButton() {
    if (activeBooster || activatedBoostersCount.current >= boosterCount) return;

    activatedBoostersCount.current += 1;
    activateBooster();
  }

  // === Появление бесплатных бустеров ===
  useEffect(() => {
    if (showResults) return;
    setBoosters([]); // сбрасываем при старте игры
    const timers: NodeJS.Timeout[] = [];
    boosterAppearTimes.forEach((appearSec, idx) => {
      const t = setTimeout(() => {
        setBoosters((prev) => [
          ...prev,
          {
            id: `booster_${Date.now()}_${idx}`,
            x: Math.random() * 80 + 10, // 10-90% ширины
            y: 100, // сверху
            rotation: Math.random() * 360,
          },
        ]);
      }, appearSec * 1000); // appearSec теперь всегда в секундах
      timers.push(t);
    });
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [showResults, boosterAppearTimes]);

  // === Движение, вращение, столкновение и удаление бустеров ===
  useEffect(() => {
    if (showResults) return;
    let lastTime = Date.now();
    let running = true;
    function gameLoop() {
      if (!running) return;
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setBoosters(
        (prev) =>
          prev
            .map((b) => ({
              ...b,
              y: b.y - BOOSTER_CONFIG.speed * dt,
              rotation: (b.rotation + BOOSTER_CONFIG.rotationSpeed * dt * 360) % 360,
            }))
            .filter((b) => b.y > -BOOSTER_CONFIG.size), // удаляем если вышел за пределы поля
      );
      // Проверка столкновения с игроком
      setBoosters((prev) =>
        prev.filter((b) => {
          const dx = b.x - playerX;
          const dy = b.y - playerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < BOOSTER_HITBOX + PLAYER_HITBOX) {
            activateBooster();
            playSound(BOOSTER_CONFIG.soundActivate, soundVolumes.boosterActivate);
            return false; // удаляем бустер
          }
          return true;
        }),
      );
      if (running) requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
    return () => {
      running = false;
    };
  }, [showResults, playerX, playerY]);

  // Цвета снарядов из конфига
  const PLAYER_LASER_COLOR = GAME_CONFIG.PLAYER_LASER_COLOR;
  const PLAYER_LASER_COLOR_BOOST = GAME_CONFIG.PLAYER_LASER_COLOR_BOOST;
  const PLAYER_ROCKET_COLOR = GAME_CONFIG.PLAYER_ROCKET_COLOR;
  const ENEMY_LASER_COLOR = GAME_CONFIG.ENEMY_LASER_COLOR;

  // === ЛОГИКА ПОЯВЛЕНИЯ БОССА ===
  useEffect(() => {
    if (showResults) {
      // После показа окна результатов — сброс состояния происходит через resetGameState
      return;
    }
    // Появление босса после таймера
    if (gameTime === 0 && playerExists && !bossExists) {
      setBoss((prev: any) => ({
        ...prev,
        y: BOSS_CONFIG.trajectory.Y_APPEAR,
        x0: (BOSS_CONFIG.trajectory.X_MIN + BOSS_CONFIG.trajectory.X_MAX) / 2, // центр по X
        y0: BOSS_CONFIG.trajectory.Y_APPEAR, // стартовая позиция по Y
        phaseX: 0,
        phaseY: 0,
        ampY: BOSS_CONFIG.trajectory.AMP_Y,
        born: Date.now(),
      }));
      setBossHP(params.boss?.bossHP || 30);
      setBossExists(true);
      setBossPhase('appearing'); // новая фаза появления
      // Проигрываем звук появления
      playSound(BOSS_CONFIG.soundAppear, GAME_CONFIG.VOLUME_BOSS_APPEAR);
    }
    // --- Больше не удаляем босса сразу после смерти игрока ---
    // if (gameTime === 0 && !playerExists && bossExists) {
    //   setBossExists(false);
    //   setBossPhase('idle');
    // }
  }, [gameTime, playerExists, bossExists, showResults]);

  // === ВЗРЫВ БОССА, ПОБЕДА, HUD ===
  // Победа после уничтожения босса: взрыв, задержка 2 сек, начисление PTS, показ Victory
  useEffect(() => {
    if (bossPhase === 'exploding' && boss && bossExists) {
      spawnExplosion(boss.x, boss.y, 'boss');
      playSound(BOSS_CONFIG.soundExplosion, 1);
      setTimeout(() => {
        setPtsEarned((prev) => prev + BOSS_CONFIG.reward);
        setIsVictory(true);
        setShowResults(true);
        setBossExists(false);
        setBossPhase('defeated');
        setBoss((prev: any) => ({ ...prev, y: 120 })); // Просто скрываем босса за пределами поля
      }, 2000);
    }
  }, [bossPhase, boss, bossExists]);

  // === СТРЕЛЬБА БОССА ===
  useEffect(() => {
    // Если игрок уничтожен — босс не стреляет
    if (!bossExists || bossPhase !== 'active' || !bossParams || !playerExists) return;
    // [FIX] Не запускать интервалы, если laserRate или rocketRate невалидны (например, 0)
    const validLaserRate = bossParams.laserRate && bossParams.laserRate > 0;
    const validRocketRate = bossParams.rocketRate && bossParams.rocketRate > 0;
    let laserInterval: NodeJS.Timeout | null = null;
    let rocketInterval: NodeJS.Timeout | null = null;
    if (validLaserRate) {
      laserInterval = setInterval(() => {
        const muzzleX = bossRef.current.x;
        const muzzleY = bossRef.current.y;
        setEnemyLasers((prev) => [
          ...prev,
          ...Array.from({ length: bossParams.laserCount }).map(() => {
            const dx = playerXRef.current - muzzleX;
            const dy = playerYRef.current - muzzleY;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const vx = (dx / len) * BOSS_CONFIG.laserSpeed;
            const vy = (dy / len) * BOSS_CONFIG.laserSpeed;
            return {
              id: `bossLaser_${Math.random().toString(36).slice(2)}`,
              x: muzzleX,
              y: muzzleY,
              type: 'bossLaser',
              vx,
              vy,
              t: 0,
            };
          }),
        ]);
        playSound(BOSS_CONFIG.soundLaser, 0.8);
      }, bossParams.laserRate);
    }
    if (validRocketRate) {
      rocketInterval = setInterval(() => {
        const muzzleX = bossRef.current.x;
        const muzzleY = bossRef.current.y;
        setEnemyLasers((prev) => [
          ...prev,
          ...Array.from({ length: bossParams.rocketCount }).map(() => {
            const dx = playerXRef.current - muzzleX;
            const dy = playerYRef.current - muzzleY;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const vx = (dx / len) * BOSS_CONFIG.rocketSpeed;
            const vy = (dy / len) * BOSS_CONFIG.rocketSpeed;
            return {
              id: `bossRocket_${Math.random().toString(36).slice(2)}`,
              x: muzzleX,
              y: muzzleY,
              type: 'bossRocket',
              vx,
              vy,
              t: 0,
            };
          }),
        ]);
        playSound(BOSS_CONFIG.soundRocket, 0.9);
      }, bossParams.rocketRate);
    }
    return () => {
      if (laserInterval) clearInterval(laserInterval);
      if (rocketInterval) clearInterval(rocketInterval);
    };
  }, [bossExists, bossPhase, bossParams, playerExists]);

  return (
    <div
      className="fixed inset-0 min-h-screen w-full flex items-center justify-center"
      style={{ background: bgParams?.fieldColor }}>
      {/* Viewport 20:9 */}
      <div className="game-viewport relative flex flex-col h-full w-full overflow-hidden">
        {/* Космический фон — строго на всю область game-viewport */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
          style={{ borderRadius: 24, zIndex: 0 }}>
          {/* Однородный фон */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'transparent',
              zIndex: 0,
              borderRadius: 24,
            }}
          />
          {/* Двигающиеся звёзды */}
          {bgParams?.stars.map((star: any, i: number) => {
            const y = (star.y * 100 + backgroundOffset) % 100;
            const x = star.x * 100;
            const size = star.size;
            const pulse = 0.7 + star.twinkle * Math.sin(Date.now() / 600 + star.phase);
            const color = star.color;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${size * pulse}px`,
                  height: `${size * pulse}px`,
                  background: color,
                  borderRadius: '50%',
                  opacity: 0.7 + 0.3 * Math.sin(Date.now() / 800 + star.phase),
                  filter: 'blur(0.5px)',
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />
            );
          })}
          {/* Двигающиеся планеты */}
          {bgParams?.planets.map((planet: any, i: number) => {
            const y = (planet.y * 100 + backgroundOffset) % 100;
            const x = planet.x * 100;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${planet.size}px`,
                  height: `${planet.size}px`,
                  background: `linear-gradient(135deg, ${planet.colorFrom}, ${planet.colorTo})`,
                  borderRadius: '50%',
                  opacity: planet.opacity,
                  filter: `blur(${planet.blur}px)`,
                  zIndex: 2,
                  pointerEvents: 'none',
                }}
              />
            );
          })}
          {/* Двигающиеся туманности */}
          {bgParams?.nebulas.map((nebula: any, i: number) => {
            const y = (nebula.y * 100 + backgroundOffset) % 100;
            const x = nebula.x * 100;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${nebula.size}px`,
                  height: `${nebula.size}px`,
                  background: `radial-gradient(circle, ${nebula.colorFrom} 0%, ${nebula.colorTo} 100%)`,
                  borderRadius: '50%',
                  opacity: nebula.opacity,
                  filter: `blur(${nebula.blur}px)`,
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />
            );
          })}
        </div>
        {/* HUD и игровая зона */}
        <div className="relative z-10 flex flex-col h-full w-full p-4 font-['Orbitron',monospace]">
          {/* Верхний HUD: PTS и VARA */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-cyan-400 font-bold text-lg glow-blue">PTS: {playerPTS}</div>
            {account && (
              <div className="text-gray-300 font-bold text-lg glow-white">
                {integerBalanceDisplay.value} {integerBalanceDisplay.unit}
              </div>
            )}
          </div>
          {/* Жизни, БУСТЕР и таймер */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <Heart
                  key={i}
                  className={`h-6 w-6 ${i < playerHP ? 'text-red-500 fill-red-500 glow-red' : 'text-gray-600'}`}
                />
              ))}
            </div>
            {/* Кнопка активации бустера */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8 text-yellow-400 border-2 border-yellow-400 glow-yellow-border hover:bg-yellow-500/10"
                onClick={handleActivateBoosterByButton}
                disabled={boosterCount === 0 || activeBooster}
                title="Activate Booster">
                <Zap className="h-5 w-5" />
              </Button>
              <span className="text-xl font-bold text-yellow-400 glow-yellow">x{boosterCount}</span>
            </div>
            <div className="text-cyan-400 font-bold text-xl glow-blue">{formatTime(gameTime)}</div>
          </div>
          {/* Игровая зона */}
          <div
            id="game-area"
            className="flex-1 relative border border-cyan-500/30 rounded-lg overflow-hidden bg-black/20">
            {/* ВРАГИ */}
            {enemiesRef.current.map((enemy) => (
              <img
                key={enemy.id}
                src="/img/alien-ship.png"
                alt="enemy"
                className="absolute select-none pointer-events-none"
                style={{
                  left: `${enemy.x}%`,
                  bottom: `${enemy.y}%`,
                  width: `${ENEMY_SIZE}px`,
                  height: `${ENEMY_SIZE}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 2,
                  userSelect: 'none',
                }}
              />
            ))}
            {/* АСТЕРОИДЫ */}
            {asteroidsRef.current.map((ast) => {
              let size = ast.size;
              if (!size) {
                size = ASTEROID_SIZE_MIN + Math.floor(Math.random() * (ASTEROID_SIZE_MAX - ASTEROID_SIZE_MIN));
                ast.size = size;
              }
              return (
                <img
                  key={ast.id}
                  src="/img/asteroid.png"
                  alt="asteroid"
                  className="absolute select-none pointer-events-none"
                  style={{
                    left: `${ast.x}%`,
                    bottom: `${ast.y}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    transform: `translateX(-50%) rotate(${ast.rotation || 0}deg)`,
                    zIndex: 1,
                    userSelect: 'none',
                  }}
                />
              );
            })}
            {/* МИНЫ */}
            {minesRef.current.map((mine, i) => {
              const scale = 1 + 0.2 * Math.sin(Date.now() / 200 + i);
              return (
                <img
                  key={mine.id}
                  src="/img/mine.png"
                  alt="mine"
                  width={MINE_SIZE}
                  height={MINE_SIZE}
                  draggable={false}
                  className="absolute select-none pointer-events-none"
                  style={{
                    left: `${mine.x}%`,
                    bottom: `${mine.y}%`,
                    width: `${MINE_SIZE}px`,
                    height: `${MINE_SIZE}px`,
                    transform: `translateX(-50%) scale(${scale})`,
                    zIndex: 1,
                    userSelect: 'none',
                    opacity: 1,
                    background: 'none',
                    boxShadow: 'none',
                  }}
                />
              );
            })}
            {/* Корабль игрока */}
            {playerExists && playerHP > 0 && (
              <>
                <img
                  src={`/img/starship-${shipLevel}.png`}
                  alt="player"
                  width={PLAYER_SHIP_BASE_SIZE + PLAYER_SHIP_SIZE_STEP * (shipLevel - 1)}
                  height={PLAYER_SHIP_BASE_SIZE + PLAYER_SHIP_SIZE_STEP * (shipLevel - 1)}
                  draggable={false}
                  className="absolute select-none pointer-events-none"
                  style={{
                    left: `${playerX}%`,
                    bottom: `${playerY}%`,
                    width: `${PLAYER_SHIP_BASE_SIZE + PLAYER_SHIP_SIZE_STEP * (shipLevel - 1)}px`,
                    height: `${PLAYER_SHIP_BASE_SIZE + PLAYER_SHIP_SIZE_STEP * (shipLevel - 1)}px`,
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    userSelect: 'none',
                    opacity: 1,
                    background: 'none',
                    boxShadow: 'none',
                  }}
                />
              </>
            )}
            {/* СНАРЯДЫ: ЛАЗЕРЫ ИГРОКА */}
            {playerLasers.map((laser) => (
              <div
                key={laser.id}
                className="absolute"
                style={{
                  left: `${laser.x}%`,
                  bottom: `${laser.y}%`,
                  width: `${PLAYER_LASER_WIDTH}px`,
                  height: `${PLAYER_LASER_HEIGHT}px`,
                  backgroundColor: activeBooster ? PLAYER_LASER_COLOR_BOOST : PLAYER_LASER_COLOR,
                  boxShadow: activeBooster ? GAME_CONFIG.PLAYER_LASER_GLOW_BOOST : GAME_CONFIG.PLAYER_LASER_GLOW,
                  transform: 'translate(-50%, 0)',
                }}
              />
            ))}
            {/* СНАРЯДЫ: РАКЕТЫ ИГРОКА */}
            {playerRockets.map((rocket) => (
              <div
                key={rocket.id}
                className="absolute rounded-full shadow-lg"
                style={{
                  left: `${rocket.x}%`,
                  bottom: `${rocket.y}%`,
                  width: `${PLAYER_ROCKET_WIDTH}px`,
                  height: `${PLAYER_ROCKET_HEIGHT}px`,
                  backgroundColor: PLAYER_ROCKET_COLOR,
                  boxShadow: GAME_CONFIG.PLAYER_ROCKET_GLOW,
                  transform: 'translateX(-50%)',
                  zIndex: 5,
                  opacity: 0.95,
                }}
              />
            ))}
            {/* СНАРЯДЫ: ЛАЗЕРЫ ВРАГОВ */}
            {enemyLasers.map((laser) => {
              if (laser.type === 'bossLaser') {
                return (
                  <div
                    key={laser.id}
                    className="absolute rounded-full shadow-lg"
                    style={{
                      left: `${laser.x}%`,
                      bottom: `${laser.y}%`,
                      width: `${BOSS_CONFIG.laserWidth}px`,
                      height: `${BOSS_CONFIG.laserHeight}px`,
                      background: BOSS_CONFIG.laserColor,
                      boxShadow: GAME_CONFIG.BOSS_LASER_GLOW,
                      transform: 'translateX(-50%)',
                      zIndex: 6,
                      opacity: 0.95,
                    }}
                  />
                );
              } else if (laser.type === 'bossRocket') {
                return (
                  <div
                    key={laser.id}
                    className="absolute rounded-full shadow-lg"
                    style={{
                      left: `${laser.x}%`,
                      bottom: `${laser.y}%`,
                      width: `${BOSS_CONFIG.rocketWidth}px`,
                      height: `${BOSS_CONFIG.rocketHeight}px`,
                      background: BOSS_CONFIG.rocketColor,
                      boxShadow: GAME_CONFIG.BOSS_ROCKET_GLOW,
                      border: BOSS_CONFIG.rocketBorder,
                      transform: 'translateX(-50%)',
                      zIndex: 7,
                      opacity: 0.98,
                    }}
                  />
                );
              } else if (laser.type === 'enemyLaser') {
                return (
                  <div
                    key={laser.id}
                    className="absolute rounded-full shadow-lg"
                    style={{
                      left: `${laser.x}%`,
                      bottom: `${laser.y}%`,
                      width: `${ENEMY_LASER_WIDTH}px`,
                      height: `${ENEMY_LASER_HEIGHT}px`,
                      backgroundColor: ENEMY_LASER_COLOR,
                      boxShadow: GAME_CONFIG.ENEMY_LASER_GLOW,
                      transform: 'translateX(-50%)',
                      zIndex: 5,
                      opacity: 0.85,
                    }}
                  />
                );
              }
              return null;
            })}
            {/* ВЗРЫВЫ: ЧАСТИЦЫ */}
            {explosionParticles.map((p) => (
              <div
                key={p.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${p.x}%`,
                  bottom: `${p.y}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: p.color,
                  borderRadius: '50%',
                  opacity: 0.7,
                  zIndex: 30,
                  transform: 'translateX(-50%) translateY(50%)',
                  boxShadow: `0 0 8px 2px ${p.color}`,
                  transition: 'opacity 0.2s',
                }}
              />
            ))}
            {/* Летящие бустеры */}
            {boosters.map((booster) => (
              <img
                key={booster.id}
                src={BOOSTER_CONFIG.icon}
                alt="booster"
                className="absolute select-none pointer-events-none"
                style={{
                  left: `${booster.x}%`,
                  bottom: `${booster.y}%`,
                  width: `${BOOSTER_CONFIG.size}px`,
                  height: `${BOOSTER_CONFIG.size}px`,
                  transform: `translateX(-50%) rotate(${booster.rotation}deg)`,
                  zIndex: 3,
                  userSelect: 'none',
                  opacity: 1,
                  background: 'none',
                }}
              />
            ))}
            {/* БОСС */}
            {bossExists && boss && (
              <>
                <img
                  src={BOSS_CONFIG.img}
                  alt="boss"
                  className="absolute select-none pointer-events-none"
                  style={{
                    left: `${boss.x}%`,
                    bottom: `${boss.y}%`,
                    width: `${BOSS_CONFIG.size}px`,
                    height: `${BOSS_CONFIG.size}px`,
                    transform: 'translateX(-50%)',
                    zIndex: 20,
                    userSelect: 'none',
                    opacity: bossPhase === 'exploding' ? 0.5 : 1,
                    filter: bossPhase === 'exploding' ? 'brightness(2) blur(2px)' : 'none',
                  }}
                />
                {/* HP BAR только одна! */}
                {bossPhase === 'active' && (
                  <div className="absolute left-1/2 top-2 -translate-x-1/2 z-50 flex flex-col items-center">
                    <div className="w-48 h-3 bg-gray-800 rounded-full border border-yellow-400 mt-1 mb-1 flex items-center relative">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-yellow-300 to-red-500 absolute left-0 top-0"
                        style={{
                          width: `${(bossHP / (params.boss?.bossHP || 30)) * 100}%`,
                          transition: 'width 0.2s',
                          zIndex: 1,
                        }}
                      />
                      <span
                        className="absolute w-full text-center text-yellow-300 font-bold text-xs tracking-widest uppercase drop-shadow-lg"
                        style={{ fontSize: '13px', letterSpacing: '2px', zIndex: 2 }}>
                        Mothership
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {/* Экран результатов */}
      <ResultsScreen
        isOpen={showResults}
        onClose={onBackToMenu}
        onReplay={gamesAvailable > 1 ? onReplayGame : undefined}
        isVictory={isVictory}
        ptsEarned={ptsEarned}
        playerPTS={playerPTS}
        playerVARA={playerVARA}
        enemiesDefeated={enemiesKilled + asteroidsKilled + minesKilled}
        asteroidsKilled={asteroidsKilled}
        minesKilled={minesKilled}
        activatedBoostersCount={activatedBoostersCount.current}
      />
      <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
          .game-viewport {
            aspect-ratio: 20/9;
            max-height: 100vh;
            width: 100vw;
            max-width: calc(100vh * 9 / 20);
            background: transparent;
            box-shadow: 0 0 32px 0 #000a, 0 0 0 100vmax #000a;
            border-radius: 24px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: stretch;
          }
          .glow-blue { text-shadow: 0 0 10px #00bcd4, 0 0 20px #00bcd4; }
          .glow-white { text-shadow: 0 0 10px #ffffff, 0 0 20px #ffffff; }
          .glow-red { text-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444; }
          .glow-yellow { text-shadow: 0 0 10px #fbbf24, 0 0 20px #fbbf24; }
          .glow-yellow-border { box-shadow: 0 0 15px rgba(251, 191, 36, 0.5); }
        `}</style>
    </div>
  );
}
