# Moolab 기술 스택

> 백엔드 경험자 기준으로, 각 기술이 왜 필요한지 / 어떤 역할인지 설명합니다.

---

## 전체 구조 한눈에 보기

```
[브라우저]
    │
    ▼
[Next.js] ← 프레임워크 (라우팅 + 렌더링 + 서버 역할까지)
    │
    ├── React         ← UI를 컴포넌트 단위로 만드는 라이브러리
    ├── Tailwind CSS  ← 스타일링 (CSS를 클래스 이름으로 대체)
    ├── Framer Motion ← 애니메이션
    └── next-intl     ← 다국어 처리 (i18n)

[배포]
    Vercel ← Next.js 만든 팀, 가장 쉬운 배포 옵션

[도메인/메일]
    Porkbun → Vercel 연결 (도메인)
    Cloudflare Email Routing (무료 메일 포워딩)
```

---

## 1. Next.js (프레임워크)

- **공식 문서:** https://nextjs.org/docs
- **한 줄 설명:** React로 웹사이트를 만들기 위한 풀스택 프레임워크

### 백엔드 경험자에게 익숙한 개념으로 설명

| 백엔드 개념 | Next.js 대응 |
|-------------|--------------|
| 라우터 (Express `/users`) | `app/` 폴더 구조가 곧 URL 경로 |
| 컨트롤러 | `page.tsx` 파일 |
| 미들웨어 | `middleware.ts` |
| API 엔드포인트 | `app/api/route.ts` |

### 핵심 개념

**App Router (폴더 = URL)**
```
app/
├── page.tsx          → https://moolab.com/
├── about/page.tsx    → https://moolab.com/about
└── news/page.tsx     → https://moolab.com/news
```

**렌더링 방식**
- **SSG (Static Site Generation):** 빌드 타임에 HTML 생성 → 랜딩페이지에 적합
- **SSR (Server Side Rendering):** 요청마다 서버에서 렌더링
- **CSR (Client Side Rendering):** 브라우저에서 렌더링 (기존 React 방식)

> Moolab 랜딩페이지는 SSG 위주로 갑니다. 속도 빠르고 배포 간단.

---

## 2. React (UI 라이브러리)

- **공식 문서:** https://react.dev
- **한 줄 설명:** UI를 "컴포넌트"라는 재사용 가능한 단위로 쪼개서 만드는 라이브러리

### 핵심 개념

**컴포넌트** — 레고 블록처럼 UI를 조각으로 만들고 조립

```tsx
// Button.tsx — 재사용 가능한 버튼 컴포넌트
export function Button({ label }: { label: string }) {
  return <button>{label}</button>
}

// 어디서든 가져다 씀
<Button label="시작하기" />
<Button label="더 보기" />
```

**Props** — 컴포넌트에 데이터를 전달하는 방법 (함수의 인자와 같음)

**State (useState)** — 컴포넌트 내부에서 변하는 값을 관리 (메뉴 열림/닫힘 등)

**useEffect** — 컴포넌트가 렌더링된 후 실행할 코드 (API 호출, 이벤트 리스너 등)

### JSX란?

HTML처럼 생겼지만 JavaScript 안에 쓰는 문법.

```tsx
// 이게 JSX
const element = <h1 className="title">안녕하세요</h1>

// 실제론 이걸로 변환됨 (직접 쓸 일 없음)
const element = React.createElement('h1', { className: 'title' }, '안녕하세요')
```

---

## 3. TypeScript

- **공식 문서:** https://www.typescriptlang.org/docs
- **한 줄 설명:** JavaScript에 타입을 추가한 언어

백엔드에서 Java/Go/Kotlin 써봤다면 바로 익숙할 것.

```ts
// JavaScript — 타입 없음, 런타임에서야 오류 발견
function add(a, b) { return a + b }

// TypeScript — 컴파일 타임에 오류 잡음
function add(a: number, b: number): number { return a + b }
```

> Next.js 프로젝트는 기본으로 TypeScript를 씁니다.

---

## 4. Tailwind CSS (스타일링)

- **공식 문서:** https://tailwindcss.com/docs
- **한 줄 설명:** CSS를 직접 쓰는 대신, 미리 만들어진 클래스 이름으로 스타일 적용

### 기존 CSS vs Tailwind 비교

```css
/* 기존 CSS — 파일 따로, 클래스명 직접 관리 */
.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 1rem;
}
```

```tsx
{/* Tailwind — 클래스명이 곧 스타일 */}
<h1 className="text-5xl font-bold text-[#1a1a1a] mb-4">
  Moolab
</h1>
```

### 자주 쓰는 클래스 패턴

| 역할 | 클래스 예시 |
|------|-------------|
| 글자 크기 | `text-sm` `text-xl` `text-5xl` |
| 굵기 | `font-normal` `font-semibold` `font-bold` |
| 색상 | `text-gray-900` `bg-white` `text-[#6FBB74]` |
| 여백 | `p-4` `px-8` `mt-6` `mb-4` |
| 레이아웃 | `flex` `grid` `items-center` `justify-between` |
| 반응형 | `md:text-xl` `lg:flex` (md: 이상에서만 적용) |

---

## 5. Framer Motion (애니메이션)

- **공식 문서:** https://www.framer.com/motion
- **한 줄 설명:** React에서 선언적으로 애니메이션을 만드는 라이브러리

```tsx
import { motion } from 'framer-motion'

// 일반 div → motion.div로 바꾸면 애니메이션 가능
<motion.div
  initial={{ opacity: 0, y: 20 }}   // 시작 상태
  animate={{ opacity: 1, y: 0 }}    // 끝 상태
  transition={{ duration: 0.5 }}    // 속도
>
  안녕하세요
</motion.div>
```

Moolab에서 쓸 것들:
- 커서 따라다니는 글로우 효과
- 스크롤시 요소 등장 애니메이션
- 버튼 hover 시 자석 효과 (magnetic button)

---

## 6. next-intl (다국어 / i18n)

- **공식 문서:** https://next-intl-docs.vercel.app
- **한 줄 설명:** Next.js에서 다국어를 처리하는 라이브러리

### 구조

```
messages/
├── ko.json   ← 한국어 텍스트
└── en.json   ← 영어 텍스트
```

```json
// ko.json
{
  "hero": {
    "title": "작은 것들을 만듭니다",
    "subtitle": "Moolab은 개인 프로젝트 스튜디오입니다"
  }
}
```

```json
// en.json
{
  "hero": {
    "title": "We build small things",
    "subtitle": "Moolab is a personal project studio"
  }
}
```

```tsx
// 컴포넌트에서 사용
const t = useTranslations('hero')
<h1>{t('title')}</h1>  // 언어 설정에 따라 자동으로 바뀜
```

URL 구조: `moolab.com/ko/` `moolab.com/en/`

---

## 7. Vercel (배포)

- **공식 문서:** https://vercel.com/docs
- **한 줄 설명:** Next.js 앱을 GitHub에 push하면 자동 배포해주는 플랫폼

### 배포 흐름

```
코드 작성 → git push → Vercel이 자동 감지 → 빌드 → 배포
                                                         ↓
                                              moolab.com 에서 확인
```

- **무료 플랜**으로 개인 프로젝트 충분히 운영 가능
- 도메인 연결 UI 제공 (Porkbun DNS 설정만 하면 됨)
- 배포 미리보기(Preview URL) 자동 생성

---

## 8. 도메인 & 메일 설정

### 도메인 연결 흐름

```
Porkbun (도메인 구매)
    └── DNS 설정: Vercel이 알려주는 A레코드 / CNAME 입력
                        ↓
                  Vercel이 moolab.com 소유권 인식
                        ↓
                  자동 HTTPS 인증서 발급
```

### 메일 설정 (무료)

**Cloudflare Email Routing** 사용 시:
- `hello@moolab.com` → 내 Gmail로 포워딩
- Porkbun에서 Cloudflare 네임서버로 변경 필요
- 완전 무료

**Zoho Mail** 사용 시:
- 실제 `@moolab.com` 메일 계정 (수신/발신 모두)
- 무료 플랜: 1개 계정, 5GB

> 둘 다 써도 됨. Cloudflare로 포워딩 + Zoho로 발신.

---

## 학습 순서 추천

처음 접하는 개념이 많을 테니 아래 순서로 훑어보는 걸 추천:

```
1. React 공식 튜토리얼 (react.dev/learn) — 1~2시간
   → 컴포넌트, Props, State 개념 파악

2. Next.js 공식 튜토리얼 (nextjs.org/learn) — 2~3시간
   → App Router, 페이지 구조 파악

3. Tailwind CSS 치트시트 훑기
   → 외울 필요 없음, 그냥 어떤 게 있는지만 파악

4. Framer Motion 기본 예제
   → motion.div, animate, transition 개념만

5. next-intl 공식 문서
   → 실제 구현할 때 보면 됨
```

> 전부 다 읽고 시작할 필요 없어요.
> 코드 보면서 모르는 게 생기면 그때 찾아보는 방식이 훨씬 빠릅니다.
