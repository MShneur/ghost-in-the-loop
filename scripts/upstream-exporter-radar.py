#!/usr/bin/env python3
"""Read-only radar for upstream ChatGPT export implementations.
Runs via existing Oracle/approved runner, never GitHub-hosted Actions.
Prints only metadata and potentially relevant upstream changes, not user chat content.
"""
import argparse
import datetime as dt
import json
import os
import sys
import re
import subprocess
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request

REPOS = [
    "pionxzh/chatgpt-exporter",
    "rashidazarang/chatgpt-chat-exporter",
    "huhusmang/ChatGPT-Exporter",
    "EpochTX/ChatGPT_Exporter",
    "Kin-Zhang/anychat-exporter",
    "Soluna-Angelito/chatgpt-conversation-exporter",
    "ha0xin/chatgpt-multimodal-exporter",
]
KEYWORDS = ("export", "conversation", "history", "endpoint", "pagination", "auth", "attachment", "download", "message", "render", "chatgpt", "scroll", "virtual", "rate")
def get(endpoint):
    req=urllib.request.Request(
        "https://api.github.com"+endpoint,
        headers={"Accept":"application/vnd.github+json",
                 "User-Agent":"Ghost-in-the-Loop-upstream-radar",
                 **({"Authorization":"Bearer "+os.environ["GITHUB_TOKEN"]} if os.environ.get("GITHUB_TOKEN") else {})}
    )
    with urllib.request.urlopen(req, timeout=16) as rsp:
        return json.load(rsp)
def pinned_head(repo):
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+",repo):
        raise ValueError("invalid public repository name")
    cp=subprocess.run(
        ["git","ls-remote","https://github.com/"+repo+".git","HEAD"],
        capture_output=True,text=True,timeout=18,check=True)
    sha=cp.stdout.strip().split()[0]
    if not re.fullmatch(r"[0-9a-fA-F]{40}",sha):
        raise ValueError("invalid repository HEAD")
    return sha

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--days",type=int,default=7)
    parser.add_argument("--registry",default=str(Path(__file__).resolve().parents[1]/
        "docs/research/GITL_EXPORTER_UPSTREAMS_20261101.json"))
    parser.add_argument("--head-only",action="store_true",
        help="Compare pinned HEADs without GitHub API requests")
    args=parser.parse_args()
    if not (1<=args.days<=90):parser.error("--days must be between 1 and 90")
    registry=json.loads(Path(args.registry).read_text(encoding="utf-8"))
    pins={item["repo"]:item for item in registry["sources"]}
    since=(dt.datetime.now(dt.timezone.utc)-dt.timedelta(days=args.days)).isoformat(timespec="seconds").replace("+00:00","Z")
    summary={"observed_at":dt.datetime.now(dt.timezone.utc).isoformat(),
      "since":since,"method":"Read-only GitHub metadata and pinned HEAD comparison; vendor updates require review",
      "repositories":[],"pinned_review_required":[]}
    repos=list(pins) if args.head_only else list(dict.fromkeys(REPOS+list(pins)))
    for repo in repos:
        entry={"repository":repo}
        if not args.head_only:
            try:
                releases=get("/repos/"+repo+"/releases?per_page=5")
                commits=get("/repos/"+repo+"/commits?"+urllib.parse.urlencode({"since":since,"per_page":50}))
                relevant=[{"sha":c["sha"][:12],"title":c["commit"]["message"].splitlines()[0][:140],
                           "url":c["html_url"]} for c in commits if
                           any(k in c["commit"]["message"].lower() for k in KEYWORDS)]
                entry.update(recent_commits=len(commits),keyword_relevant=relevant[:15],
                  latest_release=releases[0].get("tag_name") if releases else None)
            except (urllib.error.HTTPError,urllib.error.URLError,TimeoutError,KeyError,ValueError) as exc:
                entry["metadata_error"]=str(exc)
        if repo in pins:
            source=pins[repo]
            entry.update(pinned_revision=source["revision"],license=source["license"],
              role=source["role"],priority=source["priority"])
            try:
                current=pinned_head(repo)
                changed=not(current.startswith(source["revision"]) or source["revision"].startswith(current))
                entry.update(current_revision=current,needs_review=changed)
                if changed:summary["pinned_review_required"].append(repo)
            except (subprocess.SubprocessError,TimeoutError,ValueError,IndexError) as exc:
                entry["head_error"]=str(exc)
        summary["repositories"].append(entry)
    print(json.dumps(summary,indent=2))
    if all("metadata_error" in r or "head_error" in r for r in summary["repositories"]):return 2
    return 0
if __name__=="__main__":sys.exit(main())
