/**
 * 파티클 포스 시스템 — HeroSection이 힘을 설정하면 StarDust가 읽어서 적용
 * 모듈 레벨 변수이므로 rAF 루프에서만 읽기 (렌더 중 X, SSR 안전)
 */
export interface ParticleForce {
  x: number;       // viewport 좌표
  y: number;
  radius: number;
  strength: number; // 양수 = 끌어당김, 음수 = 밀어냄
}

let currentForce: ParticleForce | null = null;

export function setParticleForce(f: ParticleForce | null) {
  currentForce = f;
}

export function getParticleForce(): ParticleForce | null {
  return currentForce;
}
