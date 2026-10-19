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
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--days",type=int,default=7)
    args=parser.parse_args()
    if not (1<=args.days<=90):parser.error("--days must be between 1 and 90")
    since=(dt.datetime.now(dt.timezone.utc)-dt.timedelta(days=args.days)).isoformat(timespec="seconds").replace("+00:00","Z")
    summary={"observed_at":dt.datetime.now(dt.timezone.utc).isoformat(),"since":since,"method":"GitHub public commit metadata; source code changes require manual review before adoption","repositories":[]}
    for repo in REPOS:
        try:
            releases=get("/repos/"+repo+"/releases?per_page=5")
            commits=get("/repos/"+repo+"/commits?"+urllib.parse.urlencode({"since":since,"per_page":50}))
            relevant=[{"sha":c["sha"][:12],"title":c["commit"]["message"].splitlines()[0][:140],
                       "url":c["html_url"]} for c in commits if
                     any(k in c["commit"]["message"].lower() for k in KEYWORDS)]
            summary["repositories"].append({"repository":repo,"recent_commits":len(commits),
                "keyword_relevant":relevant[:15],"latest_release":(releases[0].get("tag_name") if releases else None)})
        except (urllib.error.HTTPError,urllib.error.URLError,TimeoutError,KeyError,ValueError) as exc:
            summary["repositories"].append({"repository":repo,"error":str(exc)})
    print(json.dumps(summary,indent=2))
    if all("error" in r for r in summary["repositories"]):return 2
    return 0
if __name__=="__main__":sys.exit(main())
