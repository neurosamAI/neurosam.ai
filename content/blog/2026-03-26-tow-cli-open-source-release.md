---
title: "Tow 오픈소스 공개 — Kubernetes 없이, SSH만으로 배포하는 경량 오케스트레이터"
date: 2026-03-26
author: Neurosam AI Team
tags: [오픈소스, Tow, 배포자동화, DevOps, CLI, SSH, Go, 에이전트리스, MCP, OpenSource]
description: "neurosam.AI가 첫 번째 오픈소스 프로젝트 Tow를 공개합니다. Kubernetes 없이 SSH만으로 베어메탈 서버와 클라우드 VM에 배포하는 경량 에이전트리스 오케스트레이터입니다. 프로젝트 자동 감지, 심링크 기반 즉시 롤백, AI 에이전트 연동까지 — 셸 스크립트와 K8s 사이의 빈 공간을 채웁니다."
slug: "tow-cli-open-source-release"
---

## TL;DR
- neurosam.AI의 첫 번째 오픈소스 프로젝트 **Tow**를 MIT 라이선스로 공개합니다
- Tow는 **Kubernetes 없이 SSH만으로 배포하는 경량 에이전트리스 오케스트레이터**입니다
- 단일 바이너리, 프로젝트 자동 감지, 심링크 기반 즉시 롤백, AI 에이전트(MCP) 연동을 지원합니다
- GitHub: [github.com/neurosamAI/tow-cli](https://github.com/neurosamAI/tow-cli) / 문서: [tow-cli.neurosam.ai](https://tow-cli.neurosam.ai)

---

## 왜 Tow를 만들었나?

세상 모든 서버가 Kubernetes 위에서 돌아가지는 않는다.

IDC에 놓인 베어메탈, 클라우드 VM, 온프레미스 서버 — 여전히 많은 팀이 SSH로 접속해서 `git pull && restart`를 치고 있다. 아니면 수백 줄짜리 배포 셸 스크립트를 유지보수하고 있거나.

그렇다고 Ansible 플레이북을 작성하자니 러닝커브가 높고, Kamal을 쓰자니 Docker가 필수다. **셸 스크립트보다는 체계적이고, Kubernetes보다는 가벼운 무언가**가 필요했다.

그래서 Tow를 만들었다.

---

## Tow가 하는 일

Tow는 **빌드 → 패키징 → 업로드 → 배포 → 헬스체크**까지의 전체 파이프라인을 하나의 커맨드로 실행한다.

```bash
# 프로젝트를 자동으로 감지하고 설정 파일을 생성한다
tow init

# 원클릭 배포: build → package → upload → install → restart
tow auto -e prod -m api-server

# 문제가 생기면 즉시 롤백
tow rollback -e prod -m api-server
```

대상 서버에는 **에이전트 설치가 필요 없다.** SSH만 열려 있으면 된다. Go로 작성된 단일 바이너리 하나가 전부다.

---

## 핵심 설계 원칙

### 1. 자동 감지 — 설정보다 관습

`tow init`을 실행하면 프로젝트 디렉토리를 스캔해서 언어, 프레임워크, 빌드 도구, 모노레포 모듈을 자동으로 감지한다. Spring Boot인지, Node.js인지, Go인지 — Tow가 알아서 판단하고 `tow.yaml` 설정 파일을 생성한다.

현재 **12개 언어/프레임워크**를 기본 지원한다: Spring Boot, Java, Node.js, Python, Go, Rust, PHP, Ruby, .NET, Kotlin, Elixir, 그리고 범용 핸들러.

### 2. 심링크 기반 원자적 배포

배포할 때마다 타임스탬프 디렉토리에 새 버전을 설치하고, `current` 심링크만 전환한다. 롤백은 심링크를 이전 디렉토리로 되돌리는 것뿐이라 **1초 이내에 완료**된다.

```
releases/
├── 20260326-143000/    ← 이전 버전
├── 20260326-150000/    ← 현재 버전 (current → 여기)
current -> releases/20260326-150000/
```

Capistrano에서 검증된 패턴이다. 다만 Tow는 Ruby가 필요 없다.

### 3. 인프라 플러그인

Kafka, Redis, MySQL, PostgreSQL, MongoDB, Elasticsearch 등 **35개 인프라 서비스**를 YAML 플러그인으로 관리할 수 있다. 코드 변경 없이 플러그인 파일 하나로 새로운 서비스를 추가할 수 있다.

### 4. AI 에이전트 네이티브 연동

```bash
tow mcp-server
```

MCP(Model Context Protocol) 서버를 내장하고 있어서 Claude, Cursor, Windsurf 같은 AI 에이전트가 Tow를 직접 호출할 수 있다. "프로덕션 서버 상태를 확인해줘", "스테이징에 배포해줘" 같은 자연어 명령이 실제 배포 액션으로 연결된다.

---

## 기존 도구와 비교

| | **Tow** | **Ansible** | **Capistrano** | **Kamal** |
|---|---|---|---|---|
| 설치 | 단일 바이너리 | Python 필요 | Ruby 필요 | Docker 필요 |
| 에이전트리스 | ✓ | ✓ | ✓ | ✗ |
| Docker 불필요 | ✓ | ✓ | ✓ | ✗ |
| 프로젝트 자동 감지 | ✓ | ✗ | ✗ | ✗ |
| 내장 헬스체크 | 4가지 | 플러그인 | ✗ | ✓ |
| 즉시 롤백 | ✓ (심링크) | 재실행 필요 | ✓ (심링크) | ✓ (컨테이너) |
| 다중 언어 지원 | 12개 타입 | 플레이북 | Ruby 중심 | Docker 이미지 |
| AI 에이전트 연동 | ✓ (MCP) | ✗ | ✗ | ✗ |

Tow의 포지션은 명확하다. **Docker 없이, 에이전트 없이, 러닝커브 없이** — SSH가 되는 서버라면 어디든 배포할 수 있는 도구.

---

## 설치

```bash
# Homebrew
brew install neurosamAI/tap/tow

# npm
npm install -g @neurosamai/tow

# Go
go install github.com/neurosamAI/tow-cli/cmd/tow@latest
```

---

## neurosam.AI의 첫 오픈소스

Tow는 neurosam.AI가 공개하는 **첫 번째 오픈소스 프로젝트**다.

AI 안내 로봇과 전화 응대 솔루션을 만드는 회사가 왜 배포 도구를 오픈소스로 내놓느냐고 물을 수 있다. 이유는 단순하다 — **우리가 매일 쓰는 도구이기 때문이다.**

neurosam.AI의 서비스는 엣지 디바이스(로봇)부터 클라우드 백엔드까지 다양한 환경에 배포된다. Kubernetes가 적합한 곳도 있지만, SSH로 직접 관리해야 하는 서버도 많다. Tow는 그 현실에서 태어났다.

좋은 도구는 혼자 쓰기 아깝다. 비슷한 고민을 하는 팀에게 도움이 되길 바란다.

---

## 기여 & 피드백

Tow는 MIT 라이선스로 공개되어 있다. 이슈, PR, 피드백 모두 환영한다.

- **GitHub**: [github.com/neurosamAI/tow-cli](https://github.com/neurosamAI/tow-cli)
- **문서**: [tow-cli.neurosam.ai](https://tow-cli.neurosam.ai)
- **오픈소스 카탈로그**: [oss.neurosam.ai](https://oss.neurosam.ai)
- **이메일**: [hello@neurosam.com](mailto:hello@neurosam.com)

---

*Neurosam AI — Connecting Intelligence to Real Life*
