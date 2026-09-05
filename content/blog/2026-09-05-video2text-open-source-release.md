---
title: "video2text 오픈소스 공개 — 완전 로컬로 돌아가는 화자 분리 회의록 전사 앱"
date: 2026-09-05
author: Murry Jeong
tags: [오픈소스, video2text, 화자분리, STT, Whisper, macOS, 프라이버시, AppleSilicon, OpenSource]
description: "neurosam.AI가 두 번째 오픈소스 프로젝트 video2text를 공개합니다. mp4 영상이나 오디오 파일을 화자 분리(diarization)된 텍스트 전사본으로 바꿔주는 완전 로컬 macOS 앱입니다. 음성 인식과 화자 분리 모두 기기 안에서만 실행되어 회의 내용이 외부로 전송되지 않습니다."
slug: "video2text-open-source-release"
---

## TL;DR
- neurosam.AI의 **두 번째 오픈소스 프로젝트** **video2text**를 MIT 라이선스로 공개합니다
- video2text는 **mp4 영상이나 오디오 파일을 화자별로 분리된 텍스트 전사본으로 바꿔주는 완전 로컬 macOS(Apple Silicon) 앱**입니다
- 음성 인식과 화자 분리 모두 **이 Mac 안에서만** 실행됩니다 — 회의 내용, 목소리, 파일이 외부 서버로 전송되지 않습니다
- 내 목소리 프로필을 등록해두면 전사 결과에 자동으로 이름이 매칭되고, 전체 재실행 없이 **재매칭/재라벨링**이 가능합니다
- GitHub: [github.com/neurosamAI/video2text](https://github.com/neurosamAI/video2text) / 문서: [video2text.neurosam.ai](https://video2text.neurosam.ai)

---

## 왜 video2text를 만들었나?

화상 회의든, 오프라인 회의를 카메라 한 대로 녹화한 것이든 — 결국 오디오 트랙 하나에 여러 사람의 목소리가 섞여 들어온다는 점은 똑같다. 회의록을 남기려면 그 녹화본을 다시 들으며 누가 무슨 말을 했는지 받아 적어야 한다.

Otter.ai, Whisper API 같은 클라우드 전사 서비스를 쓰면 빠르지만 두 가지가 걸린다. 하나는 비용이고, 다른 하나는 **회의 내용과 참석자 목소리가 통째로 외부 서버에 업로드된다는 점**이다. 사내 미팅, 채용 인터뷰, 고객 상담 녹음처럼 민감한 대화일수록 이 지점이 부담스럽다.

다행히 최근 몇 년 사이 Apple Silicon에서 돌아가는 온디바이스 추론 성능이 크게 좋아졌다. `mlx-whisper`로 Metal 가속 음성 인식을, `pyannote.audio`로 화자 분리를 로컬에서 충분히 빠르게 돌릴 수 있게 됐다. 그래서 **업로드 없이, 이 노트북 안에서 전부 끝나는** 전사 파이프라인을 만들었다.

---

## video2text가 하는 일

mp4(또는 오디오) 파일 하나를 넣으면, 다음 파이프라인을 거쳐 화자별로 정리된 텍스트를 만든다.

```
오디오 추출 → 화자 분리(diarization) → 음성 인식(transcription) → 화자 매칭 → 렌더링
```

```
[00:12:34] 홍길동: 안녕하세요, 오늘 회의 시작하겠습니다.
[00:12:41] 김철수: 네, 지난주 이슈부터 공유드릴게요.
```

네이티브 macOS 창(pywebview)에서 파일을 드래그하거나 클릭해서 선택하면, 오디오 추출 → 화자 분리 → 음성 인식 → 화자 매칭 → 완료까지 진행 상황이 실시간으로 표시된다. 결과는 TXT(읽기 편한 전사본) / SRT(자막) / JSON(화자별 블록 + 타임스탬프 원본) 세 가지 형식으로 내려받을 수 있다.

---

## 핵심 설계 원칙

### 1. 완전 로컬 — 업로드 없음

음성 인식(`mlx-whisper`, `large-v3-turbo`)과 화자 분리(`pyannote/speaker-diarization-3.1`) 모두 Apple Silicon Metal 가속으로 기기 안에서 실행된다. 처음 실행할 때 HuggingFace / Apple(mlx-community)에서 모델 가중치를 한 번 내려받는 것 외에는 어떤 파일도, 어떤 오디오도 외부로 나가지 않는다.

### 2. 내 목소리 자동 매칭

`speechbrain/spkrec-ecapa-voxceleb` 화자 임베딩으로 등록해둔 목소리 프로필과 화자 분리 결과를 비교해, "화자 1" 대신 실제 이름으로 자동 표시한다. 이름을 입력하고 10~20초 정도 문장을 읽어 녹음하거나, 기존 오디오/영상 파일을 업로드하는 것만으로 프로필을 등록할 수 있다. 동료 여러 명을 함께 등록해두면 여러 화자를 한 번에 매칭한다.

### 3. Job 히스토리 & 재매칭/재라벨링

변환 작업은 이력으로 남는다. 화자 매칭이 살짝 틀렸거나 프로필을 나중에 추가했다면, **음성 인식과 화자 분리를 처음부터 다시 돌리지 않고** 매칭만 다시 실행(rematch)하거나 화자 라벨을 직접 고쳐(relabel) 붙일 수 있다. 수십 분 걸리는 파이프라인을 통째로 반복하지 않아도 된다.

### 4. 완전히 독립적인 앱 번들

`video2text.app`은 자체 Python 런타임과 ffmpeg, torch/mlx-whisper/pyannote.audio/speechbrain 같은 수 GB짜리 의존성을 통째로 담고 있는 독립 번들이다. 원본 프로젝트 폴더를 지우거나 `/Applications`로 옮겨도, 다른 Apple Silicon Mac에 AirDrop으로 복사해도 그대로 동작한다(Homebrew도 필요 없다). Mac마다 필요한 건 사용자 본인의 HuggingFace 토큰 하나뿐이다.

---

## 설치

빌드 없이 바로 쓰고 싶다면 [Releases 페이지](https://github.com/neurosamAI/video2text/releases/latest)에서 `video2text-v1.0.0-macos-arm64.zip`을 받아 압축을 풀고 `video2text.app`을 더블클릭하면 된다.

코드를 직접 빌드하려면:

```bash
git clone https://github.com/neurosamAI/video2text
cd video2text
./build.sh   # venv 생성 + 의존성 설치 + video2text.app 번들 동기화까지 한 번에
```

`pyannote/speaker-diarization-3.1`은 HuggingFace의 gated 모델이라 무료 계정 생성과 라이선스 동의, 액세스 토큰 발급이 한 번 필요하다. 앱을 열면 맨 위 "설정" 카드에서 토큰을 저장할 수 있다.

Apple Silicon(M2 Pro 기준)에서 2시간짜리 녹화라면 화자 분리에 15~40분, 전사에 10~20분 정도 걸린다 — 인터넷 업로드 대기 시간이 없다는 점을 감안하면 체감 속도는 이보다 낫다.

---

## 라이선스

video2text 자체 코드는 [MIT License](https://github.com/neurosamAI/video2text/blob/main/LICENSE)다. 실행 중 자동으로 내려받는 AI 모델들은 각각 별도 라이선스를 따른다(모델 가중치는 저장소에 포함되지 않고, 각 사용자가 직접 내려받는다):

| 모델 | 용도 | 라이선스 |
|---|---|---|
| `pyannote/speaker-diarization-3.1` | 화자 분리 | MIT |
| `mlx-community/whisper-large-v3-turbo` | 음성 인식 | MIT |
| `speechbrain/spkrec-ecapa-voxceleb` | 화자 임베딩(프로필 매칭) | Apache 2.0 |

---

## neurosam.AI의 두 번째 오픈소스

video2text는 지난 3월 공개한 배포 도구 [Tow](/blog/2026/03/tow-cli-open-source-release/)에 이어 neurosam.AI가 공개하는 **두 번째 오픈소스 프로젝트**다.

원칙은 Tow 때와 같다 — **우리가 매일 쓰는 도구를 오픈소스로 낸다.** 팀 회의, 채용 인터뷰, 고객 미팅을 녹화해두고 나중에 다시 들으며 회의록을 정리하는 일은 어느 팀에나 있다. 그때마다 클라우드에 파일을 올리고 싶지 않았던 대표이자 개발자 [Murry Jeong(comchangs)](https://github.com/comchangs)이 주말 동안 만든 도구가 video2text다.

좋은 도구는 혼자 쓰기 아깝다. 녹화본을 텍스트로 남기고 싶은데 클라우드에는 올리고 싶지 않은 팀에게 도움이 되길 바란다.

---

## 기여 & 피드백

video2text는 MIT 라이선스로 공개되어 있다. 이슈, PR, 피드백 모두 환영한다.

- **GitHub**: [github.com/neurosamAI/video2text](https://github.com/neurosamAI/video2text)
- **문서**: [video2text.neurosam.ai](https://video2text.neurosam.ai)
- **오픈소스 카탈로그**: [oss.neurosam.ai](https://oss.neurosam.ai)
- **이메일**: [oss@neurosam.ai](mailto:oss@neurosam.ai)

---

*Created by [Murry Jeong (comchangs)](https://github.com/comchangs) — Supported by [neurosam.AI](https://neurosam.ai)*
