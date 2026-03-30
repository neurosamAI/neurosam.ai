---
title: "Tow 오픈소스 공개 — Kubernetes 없이, SSH만으로 배포하는 경량 오케스트레이터"
date: 2026-03-26
author: Murry Jeong
tags: [오픈소스, Tow, 배포자동화, DevOps, CLI, SSH, Go, 에이전트리스, MCP, OpenSource]
description: "neurosam.AI가 첫 번째 오픈소스 프로젝트 Tow를 공개합니다. Kubernetes 없이 SSH만으로 베어메탈 서버와 클라우드 VM에 배포하는 경량 에이전트리스 오케스트레이터입니다. 프로젝트 자동 감지, 심링크 기반 즉시 롤백, AI 에이전트 연동까지 — 셸 스크립트와 K8s 사이의 빈 공간을 채웁니다."
slug: "tow-cli-open-source-release"
---

## TL;DR
- neurosam.AI의 첫 번째 오픈소스 프로젝트 **Tow**를 MIT 라이선스로 공개합니다
- Tow는 **Kubernetes 없이 SSH만으로 배포하는 경량 에이전트리스 오케스트레이터**입니다
- 단일 바이너리, 프로젝트 자동 감지, 심링크 기반 즉시 롤백, AI 에이전트(MCP) 연동을 지원합니다
- **22대 프로덕션 서버**에서 실사용 검증 완료
- GitHub: [github.com/neurosamAI/tow-cli](https://github.com/neurosamAI/tow-cli) / 문서: [tow-cli.neurosam.ai](https://tow-cli.neurosam.ai)

---

## 왜 Tow를 만들었나?

세상 모든 서버가 Kubernetes 위에서 돌아가지는 않는다.

IDC에 놓인 베어메탈, 클라우드 VM, 온프레미스 서버 — 여전히 많은 팀이 SSH로 접속해서 `git pull && restart`를 치고 있다. 아니면 수백 줄짜리 배포 셸 스크립트를 유지보수하고 있거나.

그렇다고 Ansible 플레이북을 작성하자니 러닝커브가 높고, Kamal을 쓰자니 Docker가 필수다. **셸 스크립트보다는 체계적이고, Kubernetes보다는 가벼운 무언가**가 필요했다.

수년간 여러 회사와 프로젝트를 거치며 만들어온 배포 스크립트 노하우를 Go로 재구성했다. 그래서 Tow를 만들었다.

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

# 배포 전 진단
tow doctor -e prod -m api-server

# 배포 전후 변경사항 비교
tow diff -e prod -m api-server
```

대상 서버에는 **에이전트 설치가 필요 없다.** SSH만 열려 있으면 된다. Go로 작성된 단일 바이너리 하나가 전부다.

---

## 핵심 설계 원칙

### 1. 자동 감지 — 설정보다 관습

`tow init`을 실행하면 프로젝트 디렉토리를 스캔해서 언어, 프레임워크, 빌드 도구, 모노레포 모듈을 자동으로 감지한다. Spring Boot인지, Node.js인지, Go인지 — Tow가 알아서 판단하고 `tow.yaml` 설정 파일을 생성한다.

**10개 언어**, **40+ 프레임워크**를 자동 감지한다: Java(Spring Boot, Quarkus, Micronaut), Node.js(NestJS, Express, Fastify), Python(Django, FastAPI, Flask), Go(Gin, Echo, Fiber), Rust(Axum, Actix), PHP(Laravel, Symfony), Ruby(Rails, Sinatra), C#/.NET, Kotlin(Ktor), Elixir(Phoenix) 등.

### 2. 심링크 기반 원자적 배포

배포할 때마다 타임스탬프 디렉토리에 새 버전을 설치하고, `current` 심링크만 전환한다. 롤백은 심링크를 이전 디렉토리로 되돌리는 것뿐이라 **1초 이내에 완료**된다.

```
deploy/
├── 20260326-143000/    ← 이전 버전
├── 20260326-150000/    ← 현재 버전
current -> deploy/20260326-150000/
```

Capistrano에서 검증된 패턴이다. 다만 Tow는 Ruby가 필요 없다.

### 3. 인프라 플러그인 생태계

Kafka, Redis, MySQL, PostgreSQL, MongoDB, Elasticsearch, Prometheus, Grafana 등 **35개 인프라 서비스**를 YAML 플러그인으로 관리할 수 있다. 플러그인은 바이너리에 내장되어 있어 별도 설치가 불필요하다.

커뮤니티 플러그인도 지원한다:

```bash
tow plugin add someuser/tow-plugin-oracle    # GitHub에서 설치
tow plugin list                               # 설치된 플러그인 목록
```

### 4. 멀티서버 운영

여러 서버의 로그를 한 화면에서 보고, 명령을 동시에 실행할 수 있다:

```bash
# 3대 Kafka 서버 로그를 색상 구분해서 동시에 보기
tow logs -e prod -m kafka --all -F

# 모든 서버에서 디스크 사용량 확인
tow ssh -e prod -m kafka --all -- "df -h"

# 자주 쓰는 로그 조합을 프리셋으로 저장
tow logs -e prod -m kafka -s kafka-1,kafka-3 --save-preset kafka-debug
tow logs --preset kafka-debug -F   # 다음에 한 줄로 실행
```

### 5. AI 에이전트 네이티브 연동

```bash
tow mcp-server
```

MCP(Model Context Protocol) 서버를 내장하고 있어서 Claude, Cursor, Windsurf 같은 AI 에이전트가 Tow를 직접 호출할 수 있다. "프로덕션 서버 상태를 확인해줘", "에러 로그 보여줘" 같은 자연어 명령이 실제 운영 액션으로 연결된다.

**배포 도구 중 MCP를 지원하는 것은 Tow가 유일하다.**

VS Code 마켓플레이스에서도 설치 가능하다: [neurosamai.tow-cli](https://marketplace.visualstudio.com/items?itemName=neurosamai.tow-cli)

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
| 인프라 플러그인 | 35개 | 갤럭시 | ✗ | ✗ |
| 멀티서버 로그 | ✓ (색상 구분) | ✗ | ✗ | ✗ |
| AI 에이전트 연동 | ✓ (MCP) | ✗ | ✗ | ✗ |

Tow의 포지션은 명확하다. **Docker 없이, 에이전트 없이, 러닝커브 없이** — SSH가 되는 서버라면 어디든 배포할 수 있는 도구.

---

## 프로덕션 검증

Tow는 이론이 아닌 실전에서 검증되었다. [Balkari Inc.](https://balkari.io)의 프로덕션 환경에서 **22대 서버**를 대상으로 테스트를 완료했다:

- Spring Boot 마이크로서비스 (API, Admin, Scheduler, Runner 등)
- Kafka 3노드 클러스터 + ZooKeeper
- Redis, MongoDB, Prometheus, Grafana, Logstash, Loki
- 레거시 배포 스크립트와 완전 호환 (기존 디렉토리 구조 유지)

```
$ tow doctor -e prod -m api-server
  ✓ tow.yaml is valid
  ✓ SSH connection successful
  ✓ Remote dir exists
  ✓ Disk space — Available: 4.9G
  ✓ No active deploy lock
  9 passed, 0 failed
```

---

## 설치

```bash
# Homebrew
brew install neurosamAI/tap/tow

# npm
npm install -g @neurosamai/tow

# Go
go install github.com/neurosamAI/tow-cli/cmd/tow@latest

# 바이너리 직접 다운로드
curl -fsSL https://raw.githubusercontent.com/neurosamAI/tow-cli/main/install.sh | bash
```

---

## neurosam.AI의 첫 오픈소스

Tow는 neurosam.AI가 공개하는 **첫 번째 오픈소스 프로젝트**다.

AI 안내 로봇과 전화 응대 솔루션을 만드는 회사가 왜 배포 도구를 오픈소스로 내놓느냐고 물을 수 있다. 이유는 단순하다 — **우리가 매일 쓰는 도구이기 때문이다.**

neurosam.AI의 서비스는 엣지 디바이스(로봇)부터 클라우드 백엔드까지 다양한 환경에 배포된다. Kubernetes가 적합한 곳도 있지만, SSH로 직접 관리해야 하는 서버도 많다. Tow는 그 현실에서 태어났고, 대표이자 개발자인 [Murry Jeong(comchangs)](https://github.com/comchangs)이 수년간 쌓아온 배포 노하우를 집약한 결과물이다.

좋은 도구는 혼자 쓰기 아깝다. 비슷한 고민을 하는 팀에게 도움이 되길 바란다.

---

## 기여 & 피드백

Tow는 MIT 라이선스로 공개되어 있다. 이슈, PR, 피드백 모두 환영한다.

- **GitHub**: [github.com/neurosamAI/tow-cli](https://github.com/neurosamAI/tow-cli)
- **문서**: [tow-cli.neurosam.ai](https://tow-cli.neurosam.ai)
- **VS Code**: [neurosamai.tow-cli](https://marketplace.visualstudio.com/items?itemName=neurosamai.tow-cli)
- **오픈소스 카탈로그**: [oss.neurosam.ai](https://oss.neurosam.ai)
- **이메일**: [oss@neurosam.ai](mailto:oss@neurosam.ai)

---

*Created by [Murry Jeong (comchangs)](https://github.com/comchangs) — Supported by [neurosam.AI](https://neurosam.ai)*
