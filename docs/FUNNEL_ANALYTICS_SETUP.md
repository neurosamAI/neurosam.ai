# 퍼널 분석 셋업 가이드

GA4 + Microsoft Clarity 조합으로 neurosam.ai 5단계 퍼널을 측정·시각화합니다.

## 5단계 퍼널 모델

| 단계 | 이름 | 측정 이벤트 |
|---|---|---|
| 1 | **Landing** (페이지 진입) | `page_view` (GA4 enhanced measurement 자동) |
| 2 | **Engagement** (콘텐츠 흥미) | `funnel_hero_view` / `funnel_pain_view` / `funnel_why_view` / `scroll_milestone`(50%) |
| 3 | **Interest** (탐색·심층) | `funnel_usecases_view` / `cta_click`(label: 유스케이스 카드/Pain 카드) / `scroll_milestone`(90%) |
| 4 | **Intent** (의도 표현) | `cta_click`(label: AI바우처 도입 상담 / 도입 문의 등) / `form_start` |
| 5 | **Conversion** (최종 행동) | `form_submit` (form_name: contact / lite) |

## 사이트에 이미 적용된 이벤트 카탈로그

| 이벤트 | 트리거 | 파라미터 |
|---|---|---|
| `funnel_{section}_view` | 6개 섹션이 화면에 40% 이상 보이면 한 번 (세션) | `section`, `page_path` |
| `cta_click` | data-cta-label 부착된 모든 CTA·카드 클릭 | `cta_label`, `cta_location`, `destination`, `page_path` |
| `form_start` | Contact/Lite 폼 첫 입력 focus | `form_name`, `page_path` |
| `form_submit` | 폼 제출 시 | `form_name`, `page_path` |
| `scroll_milestone` | 50% / 90% 스크롤 도달 | `milestone`, `page_path` |
| `outbound_click` | LinkedIn·GitHub·oss·tow-cli 외부 링크 클릭 | `destination`, `label`, `page_path` |

전체 트래킹 로직: [themes/neurosam/layouts/partials/funnel-tracking.html](../themes/neurosam/layouts/partials/funnel-tracking.html)

## Step 1. GA4 발급 + 연결

### 1-1. Google Analytics 4 property 생성
1. https://analytics.google.com 접속 → Admin → Create Property
2. Property name: `neurosam.AI`, Reporting time zone: `Korea Standard Time`, Currency: `KRW`
3. Business details: 산업 = `Technology`, Business size = 1~10
4. Stream 추가 → Web → URL: `https://neurosam.ai`, Stream name: `neurosam.ai web`
5. **Measurement ID (G-XXXXXXXXXX)** 복사

### 1-2. neurosam.ai 사이트에 적용
```toml
# hugo.toml
[params.analytics]
  ga4_id = 'G-XXXXXXXXXX'    # ← 여기 붙여넣기
  plausible_domain = ''
  clarity_id = ''
```
commit → push → 배포되면 자동 활성화.

### 1-3. Enhanced Measurement 옵션 확인
GA4 → Admin → Data Streams → 해당 스트림 → Enhanced measurement
- ☑ Page views (필수)
- ☑ Scrolls (90% 자동 측정 — 우리는 50%·90% 둘 다 따로 측정)
- ☑ Outbound clicks
- ☑ Site search (사이트 내 검색 없으면 비활성 가능)
- ☑ Form interactions (우리는 자체 form_start·form_submit 사용)

### 1-4. Custom Dimensions 등록 (퍼널 보고서용)
GA4 → Admin → Custom definitions → Custom dimensions → Create
| Dimension name | Scope | Event parameter |
|---|---|---|
| Section | Event | section |
| CTA Label | Event | cta_label |
| CTA Location | Event | cta_location |
| Form Name | Event | form_name |
| Scroll Milestone | Event | milestone |

등록 후 약 24시간 뒤부터 보고서에서 dimension으로 사용 가능.

## Step 2. Microsoft Clarity 발급 + 연결

### 2-1. Clarity project 생성
1. https://clarity.microsoft.com 접속 → Sign in (Microsoft / Google / Facebook)
2. New Project → Name: `neurosam.AI`, Website: `https://neurosam.ai`, Category: `Business`
3. Setup → **Project ID** (예: `abcdefghij`) 복사

### 2-2. neurosam.ai 사이트에 적용
```toml
# hugo.toml
[params.analytics]
  ga4_id = 'G-XXXXXXXXXX'
  plausible_domain = ''
  clarity_id = 'abcdefghij'   # ← 여기 붙여넣기
```

### 2-3. Clarity 활용
- **Recordings**: 실제 사용자 세션 영상 재생 (Hero 비주얼 효과, CTA 미클릭 원인 시각 확인)
- **Heatmaps**: 클릭/스크롤/이동 히트맵 (어떤 CTA가 가장 많이 클릭되는지)
- **Insights** → 자동 발견 (Rage clicks, Dead clicks, Excessive scrolling 등)
- Custom tags (우리 funnel-tracking이 자동 발화) — recording 필터링에 사용

## Step 3. GA4 5단계 퍼널 보고서 설정

### 3-1. Explore → Funnel exploration 생성
GA4 → Explore → Funnel exploration

### 3-2. 단계 정의
| Step | Step name | Event | 조건 (Event parameter equals) |
|---|---|---|---|
| 1 | Landing | `page_view` | (없음) |
| 2 | Engagement | `funnel_hero_view` OR `scroll_milestone` | (milestone=50) |
| 3 | Interest | `funnel_usecases_view` OR `cta_click` | (cta_location IN [`usecases-grid`, `pain-grid`, `usecases-list`]) |
| 4 | Intent | `cta_click` OR `form_start` | (cta_location IN [`hero`, `why-inline`, `usecases-voucher-box`, `sticky-mobile`, `nav-desktop`, `nav-mobile`, `contact-section`, `usecase-hero`, `usecase-bottom`]) |
| 5 | Conversion | `form_submit` | (form_name IN [`contact`, `lite`]) |

### 3-3. 보고서 시각화
- Closed funnel: 단계 순서 강제
- Open funnel: 어느 단계에서 진입해도 OK (재방문자 패턴 파악)
- Visualization: Standard funnel (전환율) + Trended funnel (시간별 변화)

### 3-4. 세그먼트 분기 (권장)
| Segment | 정의 | 목적 |
|---|---|---|
| Mobile | device.category = "mobile" | 모바일 vs 데스크탑 전환 차이 |
| Organic search | source/medium contains "organic" | SEO 트래픽 quality |
| Direct | source/medium = "(direct)" | 브랜드 인지 트래픽 |
| Returning | new_user = false | 재방문자 흐름 |

## Step 4. 측정 검증

배포 후 24시간 내:
1. GA4 → Reports → Realtime → 직접 사이트 방문해 이벤트 발화 확인 (`funnel_hero_view`·`cta_click` 등)
2. DebugView 활성화 (Chrome GA4 Debugger 확장 또는 `?_dbg=1` 파라미터)
3. Clarity → Recordings → 본인 세션 재생 확인

## 참고: 향후 추가 가능한 이벤트

```javascript
// 임의 위치에서 호출 가능
window.trackEvent('custom_event_name', {
  custom_param_1: 'value',
  custom_param_2: 123
});
```

자동 분기되어 GA4·Plausible·Clarity·dataLayer 모두에 전송됩니다.

---

마지막 업데이트: 2026-05-21
