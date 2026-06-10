---
title: "Introducing Tow — A Lightweight Orchestrator That Deploys over SSH, No Kubernetes"
date: 2026-03-26
author: Murry Jeong
tags: [open source, Tow, deployment automation, DevOps, CLI, SSH, Go, agentless, MCP, OpenSource]
description: "neurosam.AI releases its first open-source project, Tow — a lightweight, agentless orchestrator that deploys to bare-metal servers and cloud VMs over SSH alone, no Kubernetes required. Project auto-detection, symlink-based instant rollback, and AI-agent integration fill the gap between shell scripts and K8s."
slug: "tow-cli-open-source-release"
---

## TL;DR
- We're releasing **Tow**, neurosam.AI's first open-source project, under the MIT license.
- Tow is a **lightweight, agentless orchestrator that deploys over SSH alone — no Kubernetes**.
- It supports a single binary, project auto-detection, symlink-based instant rollback, and AI-agent (MCP) integration.
- Validated in production across **22 servers**.
- GitHub: [github.com/neurosamAI/tow-cli](https://github.com/neurosamAI/tow-cli) / Docs: [tow-cli.neurosam.ai](https://tow-cli.neurosam.ai)

---

## Why we built Tow

Not every server in the world runs on Kubernetes.

Bare-metal boxes in a data center, cloud VMs, on-prem servers — many teams still SSH in and run `git pull && restart`. Or they maintain hundreds of lines of deployment shell scripts.

Writing Ansible playbooks has a steep learning curve, and Kamal requires Docker. We needed **something more structured than a shell script but lighter than Kubernetes**.

So we rebuilt years of deployment-script know-how, gathered across many companies and projects, in Go. That became Tow.

---

## What Tow does

Tow runs the entire **build → package → upload → deploy → health check** pipeline in a single command.

```bash
# Auto-detect the project and generate a config file
tow init

# One-click deploy: build → package → upload → install → restart
tow auto -e prod -m api-server

# Instant rollback when something breaks
tow rollback -e prod -m api-server

# Pre-deploy diagnostics
tow doctor -e prod -m api-server

# Compare changes before and after a deploy
tow diff -e prod -m api-server
```

Target servers need **no agent installed**. SSH access is all it takes. A single binary written in Go is the whole thing.

---

## Core design principles

### 1. Auto-detection — convention over configuration

Run `tow init` and it scans your project directory to auto-detect the language, framework, build tool, and monorepo modules. Spring Boot, Node.js, or Go — Tow figures it out and generates a `tow.yaml` config file.

### 2. Atomic deploys with symlinks — instant rollback

Each release goes into a timestamped directory, and a symlink switch makes it live. Rollback is just pointing the symlink back — instant, with zero downtime.

### 3. Agentless — SSH is all you need

No daemon to install on the target, no Docker requirement. If you can SSH in, you can deploy.

### 4. AI-agent integration via MCP

Tow exposes its operations through the Model Context Protocol (MCP), so AI agents can drive deployments directly. **Tow is the only deployment tool with MCP support.**

Also installable from the VS Code Marketplace: [neurosamai.tow-cli](https://marketplace.visualstudio.com/items?itemName=neurosamai.tow-cli)

---

## How it compares

| | **Tow** | **Ansible** | **Capistrano** | **Kamal** |
|---|---|---|---|---|
| Install | Single binary | Requires Python | Requires Ruby | Requires Docker |
| Agentless | ✓ | ✓ | ✓ | ✗ |
| No Docker needed | ✓ | ✓ | ✓ | ✗ |
| Project auto-detection | ✓ | ✗ | ✗ | ✗ |
| Built-in health checks | 4 types | Plugin | ✗ | ✓ |
| Instant rollback | ✓ (symlink) | Re-run needed | ✓ (symlink) | ✓ (container) |
| Multi-language support | 12 types | Playbooks | Ruby-centric | Docker images |
| Infra plugins | 35 | Galaxy | ✗ | ✗ |
| Multi-server logs | ✓ (color-coded) | ✗ | ✗ | ✗ |
| AI-agent integration | ✓ (MCP) | ✗ | ✗ | ✗ |

Tow's position is clear: **no Docker, no agent, no learning curve** — deploy to any server you can reach over SSH.

---

## Production-validated

Tow was proven in practice, not in theory. It was tested against **22 servers** in the production environment of [Balkari Inc.](https://balkari.io):

- Spring Boot microservices (API, Admin, Scheduler, Runner, and more)
- A 3-node Kafka cluster + ZooKeeper
- Redis, MongoDB, Prometheus, Grafana, Logstash, Loki
- Fully compatible with legacy deployment scripts (preserving the existing directory structure)

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

## Install

```bash
# Homebrew
brew install neurosamAI/tap/tow

# npm
npm install -g @neurosamai/tow

# Go
go install github.com/neurosamAI/tow-cli/cmd/tow@latest

# Direct binary download
curl -fsSL https://raw.githubusercontent.com/neurosamAI/tow-cli/main/install.sh | bash
```

---

## neurosam.AI's first open source

Tow is the **first open-source project** neurosam.AI has released.

You might ask why a company building AI reception robots and phone-answering solutions would open-source a deployment tool. The reason is simple — **it's a tool we use every day.**

neurosam.AI's services deploy across environments from edge devices (robots) to cloud backends. Kubernetes fits in some places, but there are also plenty of servers we manage directly over SSH. Tow was born from that reality — the distilled deployment know-how that founder and developer [Murry Jeong (comchangs)](https://github.com/comchangs) has built up over years.

A good tool is too useful to keep to yourself. We hope it helps teams wrestling with the same problem.

---

## Contribute & feedback

Tow is released under the MIT license. Issues, PRs, and feedback are all welcome.

- **GitHub**: [github.com/neurosamAI/tow-cli](https://github.com/neurosamAI/tow-cli)
- **Docs**: [tow-cli.neurosam.ai](https://tow-cli.neurosam.ai)
- **VS Code**: [neurosamai.tow-cli](https://marketplace.visualstudio.com/items?itemName=neurosamai.tow-cli)
- **Open-source catalog**: [oss.neurosam.ai](https://oss.neurosam.ai)
- **Email**: [oss@neurosam.ai](mailto:oss@neurosam.ai)

---

*Created by [Murry Jeong (comchangs)](https://github.com/comchangs) — Supported by [neurosam.AI](https://neurosam.ai)*
