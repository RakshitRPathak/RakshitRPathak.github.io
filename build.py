#!/usr/bin/env python3
"""Build the site from data/site.json.

    python3 build.py

Writes index.html, projects/, projects/<slug>/, research/, experience/, resumes/, contact/, 404.html and sitemap.xml.
Standard library only. Styles live in assets/site.css and behaviour in assets/site.js; edit those directly.
"""
import json
import shutil
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent
D = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
P = D["person"]
SITE = P["site"].rstrip("/")
PROJECTS = D["projects"]
BY_SLUG = {p["slug"]: p for p in PROJECTS}
TRACKS = D["tracks"]
NAV = [("/projects/", "Projects"), ("/research/", "Research"), ("/experience/", "Experience"), ("/resumes/", "Résumés"), ("/contact/", "Contact")]


def e(s):
    return escape(str(s), quote=True)


# Small, generic line icons.
ICON = {
    "ext": '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',
    "sun": '<svg class="i sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    "moon": '<svg class="i moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>',
    "menu": '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>',
    "pdf": '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
}
MARK = '<span class="mark" aria-hidden="true"><svg viewBox="0 0 14 14"><rect x="1" y="8" width="3" height="5" rx="1"/><rect x="5.5" y="5" width="3" height="8" rx="1"/><rect x="10" y="1" width="3" height="12" rx="1"/></svg></span>'
FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2315171c'/%3E%3Crect x='7' y='18' width='4' height='7' rx='1' fill='%23fff'/%3E%3Crect x='14' y='12' width='4' height='13' rx='1' fill='%23fff'/%3E%3Crect x='21' y='7' width='4' height='18' rx='1' fill='%23fff'/%3E%3C/svg%3E"


def ext(href, text, cls="btn", icon=False):
    return f'<a class="{cls}" href="{e(href)}" target="_blank" rel="noopener">{e(text)}{ICON["ext"] if icon else ""}</a>'


def status_pill(p):
    return '<span class="pill prog">In progress</span>' if p["status"] == "prog" else '<span class="pill ok">Complete</span>'


def page(path, title, desc, body, active=None, extra_head=""):
    full_title = title if title == P["name"] else f"{title} · {P['name']}"
    nav = "".join(f'<a href="{h}"{" aria-current=page" if h == active else ""}>{e(t)}</a>' for h, t in NAV)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(full_title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{SITE}{path}">
<meta property="og:title" content="{e(full_title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{SITE}{path}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#fbfbfc" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f1116" media="(prefers-color-scheme: dark)">
<script>try{{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}}catch(e){{}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/assets/site.css">
<link rel="icon" href="{FAVICON}">
{extra_head}</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="top-in">
    <a class="name" href="/">{MARK}<span class="full">{e(P["name"])}</span><span class="short">Rakshit Pathak</span></a>
    <nav class="nav" aria-label="Main">{nav}</nav>
    <div class="tools">
      {ext(P["linkedin"], "LinkedIn", "btn sm", icon=True)}
      <button class="icon theme" type="button" aria-label="Switch theme">{ICON["sun"]}{ICON["moon"]}</button>
      <button class="icon menu" type="button" aria-expanded="false" aria-controls="mnav" aria-label="Open menu">{ICON["menu"]}</button>
    </div>
  </div>
  <nav class="mnav" id="mnav" aria-label="Main" hidden><a href="/"{" aria-current=page" if path == "/" else ""}>Home</a>{nav}</nav>
</header>
<main id="main" tabindex="-1">
{body}
</main>
<footer class="foot">
  <div class="foot-in">
    <span>{e(P["name"])}, VIT Vellore, class of 2027</span>
    <nav aria-label="Elsewhere"><a href="mailto:{e(P["email"])}">{e(P["email"])}</a><a href="{e(P["linkedin"])}" target="_blank" rel="noopener">LinkedIn</a><a href="{e(P["github"])}" target="_blank" rel="noopener">GitHub</a><a href="/resumes/">Résumés</a></nav>
  </div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
"""


def fmt(n):
    return f"{n:,.1f}"


def chart():
    rows = []
    for i, r in enumerate(D["ladder"]):
        pct = 100 * r["gf"] / r["ref"] if r["gf"] else 100.0
        who = f'<a href="/projects/{r["slug"]}/">{e(r["who"])}</a>' if r["slug"] else e(r["who"])
        val = f'<small>{fmt(r["gf"])} GFLOP/s</small>{pct:.1f}%' if r["gf"] else "100%"
        rows.append(f'<li class="rung {e(r["cls"])}" style="--i:{i}"><span class="who">{who}<span>{e(r["note"])}</span></span>'
                    f'<span class="val">{val}</span><span class="track" aria-hidden="true"><span class="fill" style="--w:{pct:.2f}%"></span></span></li>')
    gh = P["github"]
    return f"""<figure class="tile wide chart" style="margin:0" aria-labelledby="chart-title">
      <div><h2 id="chart-title">My matrix-multiply kernels on a Tesla T4</h2><p class="sub">Throughput as a share of cuBLAS, N = 2048, FP32</p></div>
      <ol class="rungs">{"".join(rows)}</ol>
      <figcaption class="note">Each bar is relative to cuBLAS timed in the same run. Raw numbers are in the <a href="{gh}/cuda-gpu-bench#results">cuda-gpu-bench</a> and <a href="{gh}/ptxforge#results">PTXForge</a> READMEs.</figcaption>
    </figure>"""


def feature_tile(f):
    p = BY_SLUG[f["project"]]
    dot = '<span class="dot prog" title="In progress"></span>' if p["status"] == "prog" else '<span class="dot" title="Complete"></span>'
    return f"""<a class="tile" href="/projects/{p["slug"]}/">
      <div class="row-top"><div><h3>{e(p["title"])}</h3><p class="kicker">{e(p["sub"])}</p></div>{dot}</div>
      <div class="tile-foot"><div class="big">{e(f["value"])}</div><p>{e(f["label"])}</p></div>
    </a>"""


def home():
    feats = [feature_tile(f) for f in D["featured"]]
    published = sum(1 for x in D["patents"] if x["status"] == "Published")
    intern = D["experience"][0]
    body = f"""<section class="hero">
  <span class="pill ok">{e(P["availability"])}</span>
  <h1>{e(P["name"])}</h1>
  <p class="lead">I build <b>compilers, GPU kernels, ML systems and backends</b>, and I show how I measured them.</p>
  <p class="facts">{e(P["facts"])}</p>
  <div class="actions"><a class="btn primary" href="/projects/">View projects</a>{ext(P["linkedin"], "LinkedIn", icon=True)}<a class="btn" href="/resumes/">Résumés</a></div>
</section>
<section class="stack">
  <div class="shead"><h2>Selected work</h2><a href="/projects/">All {len(PROJECTS)} projects</a></div>
  <div class="bento">
    {chart()}
    {feats[0]}
    {feats[1]}
    {feats[2]}
    {feats[3]}
    {feats[4]}
    {feats[5]}
    <a class="tile" href="/research/"><p class="kicker">Research</p><div class="tile-foot"><div class="big">{len(D["patents"])} patents</div><p>filed through the VIT IPR Cell, {published} published, and {len(D["papers"])} manuscripts submitted to IEEE Access</p></div></a>
    <a class="tile" href="/experience/"><p class="kicker">Experience</p><div class="tile-foot"><h3>{e(intern["title"])}</h3><p>{e(intern["org"].split(",")[0])}, {e(intern["when"])}. RAG features for a healthcare product, plus security policies for three clients.</p></div></a>
    <div class="tile cta"><div><h2>Hiring interns for January 2027?</h2><p style="margin-top:8px">I'm looking for a six-month internship in software engineering, ML engineering or compilers.</p></div>
      <div class="actions"><a class="btn primary" href="mailto:{e(P["email"])}">Email me</a>{ext(P["linkedin"], "LinkedIn", "btn on-panel", icon=True)}</div></div>
  </div>
</section>"""
    redirect = """<script>(function(){var h=decodeURIComponent(location.hash.slice(1));if(!h||h==="top")return;var m={work:"/projects/",research:"/research/",experience:"/experience/",resumes:"/resumes/",contact:"/contact/"};
var t=h.indexOf("p-")===0?"/projects/"+h.slice(2)+"/":m[h];if(t)location.replace(t);})();</script>
"""
    return page("/", P["name"], f"{P['name']}: compilers and GPU kernels in C++, ML systems with measured results, tested backends. {P['availability_long']}", body, extra_head=redirect)


def project_card(p, kicker=True):
    k = f'<p class="kicker">{e(TRACKS[p["track"]]["name"])}</p>' if kicker else ""
    return f"""<a class="pcard" href="/projects/{p["slug"]}/" data-track="{e(p["track"])}">
      {k}<h3>{e(p["title"])}</h3>
      <p>{e(p["lede"])}</p>
      <div class="meta">{status_pill(p)}<span class="pill">{e(p["data"])}</span></div>
    </a>"""


def projects_index():
    tabs = "".join(f'<button type="button" data-filter="{k}" aria-pressed="false">{e(t["short"])}</button>' for k, t in TRACKS.items())
    body = f"""<div class="phead"><h1>Projects</h1><p>Every project links to its code, and each page says where its numbers come from and what hasn't been verified yet.</p></div>
<section class="stack">
  <div class="shead"><div class="tabs" data-tabs role="group" aria-label="Filter projects" hidden><button type="button" data-filter="all" aria-pressed="true">All</button>{tabs}</div><span class="count" data-count aria-live="polite">{len(PROJECTS)} projects</span></div>
  <div class="grid2">{"".join(project_card(p) for p in PROJECTS)}</div>
</section>"""
    return page("/projects/", "Projects", f"All {len(PROJECTS)} projects by {P['name']}: compilers, GPU kernels, ML systems and backends, each with its results and caveats.", body, active="/projects/")


def project_page(p):
    i = PROJECTS.index(p)
    prev, nxt = PROJECTS[i - 1], PROJECTS[(i + 1) % len(PROJECTS)]
    links = "".join(ext(h, t, "btn primary" if j == 0 else "btn on-panel") for j, (t, h) in enumerate(p["links"]))
    kv = "".join(f"<div><dt>{e(a)}</dt><dd>{e(b)}</dd></div>" for a, b in p["results"])
    caveat = f'<p class="caveat"><b>Before you quote these:</b> {e(p["caveat"])}</p>' if p.get("caveat") else ""
    patent = f'<span class="pill">Patent: {e(p["patent"])}</span>' if p.get("patent") else ""
    related = [q for q in PROJECTS if q["track"] == p["track"] and q is not p][:3]
    rel = f"""<section class="stack"><div class="shead"><h2>More in {e(TRACKS[p["track"]]["name"].lower())}</h2><a href="/projects/#{e(p["track"])}">See all</a></div>
  <div class="grid3">{"".join(project_card(q, kicker=False) for q in related)}</div></section>""" if related else ""
    body = f"""<div class="stack" style="gap:28px">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/projects/">Projects</a><span aria-hidden="true">/</span><a href="/projects/#{e(p["track"])}">{e(TRACKS[p["track"]]["name"])}</a></nav>
  <header class="dhead">
    <h1>{e(p["title"])}</h1>
    <p class="lede">{e(p["lede"])}</p>
    <div class="pills">{status_pill(p)}{patent}</div>
  </header>
</div>
<div class="dgrid">
  <div class="story">
    <section><h2>The problem</h2><p>{e(p["problem"])}</p></section>
    <section><h2>How it works</h2>
      <ol class="steps" aria-label="Pipeline">{"".join(f"<li><span>{e(s)}</span></li>" for s in p["pipe"])}</ol>
      <ul>{"".join(f"<li>{e(h)}</li>" for h in p["how"])}</ul>
    </section>
    <section><h2>Built with</h2><div class="pills">{"".join(f'<span class="pill">{e(s)}</span>' for s in p["stack"])}</div></section>
  </div>
  <aside class="sheet" aria-labelledby="results-title">
    <h2 id="results-title">Results</h2>
    <div class="source"><span>Numbers come from</span><b>{e(p["data"])}</b></div>
    <dl class="kv">{kv}</dl>
    {caveat}
    <div class="actions">{links}</div>
  </aside>
</div>
{rel}
<nav class="pager" aria-label="Previous and next project"><a href="/projects/{prev["slug"]}/"><span>Previous</span><b>{e(prev["title"])}</b></a><a href="/projects/{nxt["slug"]}/"><span>Next</span><b>{e(nxt["title"])}</b></a></nav>"""
    return page(f"/projects/{p['slug']}/", p["title"], f"{p['title']}: {p['lede']}", body, active="/projects/")


def research():
    pats = "".join(f"""<a class="card" href="/projects/{x["project"]}/">
      <div class="meta">{'<span class="pill ok">Published</span>' if x["status"] == "Published" else '<span class="pill prog">Filed</span>'}<span>{e("Application " + x["number"]) if x["number"] else "Application number not yet assigned"}</span></div>
      <h3>{e(x["title"])}</h3><p>Prototype: {e(BY_SLUG[x["project"]]["title"])}</p></a>""" for x in D["patents"])
    papers = "".join(f"""<a class="card" href="/projects/{x["project"]}/"><h3>{e(x["title"])}</h3><p>Code and data: {e(BY_SLUG[x["project"]]["title"])}</p></a>""" for x in D["papers"])
    published = sum(1 for x in D["patents"] if x["status"] == "Published")
    body = f"""<div class="phead"><h1>Research and patents</h1><p>{len(D["patents"])} patent applications filed through the VIT IPR Cell, {published} published. Each one has a working prototype or study on GitHub.</p></div>
<section class="stack"><h2 style="font-size:1.6rem">Patents</h2><div class="grid2">{pats}</div></section>
<section class="stack"><div><h2 style="font-size:1.6rem">Manuscripts submitted to IEEE Access</h2><p class="muted" style="margin-top:8px">Each one ships with open code, data and a one-command reproducible run.</p></div><div class="grid3">{papers}</div></section>"""
    return page("/research/", "Research", f"{len(D['patents'])} patent applications ({published} published) and {len(D['papers'])} IEEE Access manuscripts by {P['name']}, each with code on GitHub.", body, active="/research/")


def experience():
    items = "".join(f"""<div class="tl"><div class="when">{e(x["when"])}</div><div><h3>{e(x["title"])}</h3><p class="org">{e(x["org"])}</p><ul>{"".join(f"<li>{e(pt)}</li>" for pt in x["points"])}</ul></div></div>""" for x in D["experience"])
    body = f"""<div class="phead"><h1>Experience</h1><p>Internships, education and what I do outside class.</p></div>
<div class="timeline">{items}</div>
<div class="actions"><a class="btn primary" href="/resumes/">Get a résumé</a>{ext(P["linkedin"], "LinkedIn", icon=True)}</div>"""
    return page("/experience/", "Experience", f"{P['name']}: internships at aiDataWorks and THDC India, B.Tech at VIT Vellore, and leadership.", body, active="/experience/")


def resumes():
    cards = "".join(f"""<div class="card"><h3>{e(r["title"])}</h3><p>{e(r["about"])}</p><a class="btn on-panel" href="/resume/{e(r["file"])}" target="_blank" rel="noopener">{ICON["pdf"]}Open PDF</a></div>""" for r in D["resumes"])
    body = f"""<div class="phead"><h1>Résumés</h1><p>One page each, with the same facts and a different emphasis for each kind of role.</p></div>
<div class="grid3">{cards}</div>"""
    return page("/resumes/", "Résumés", f"One-page résumés of {P['name']} for software engineering, AI/ML and compiler roles.", body, active="/resumes/")


def contact():
    body = f"""<div class="phead"><h1>Contact</h1><p>{e(P["availability_long"])} Email or LinkedIn is the fastest way to reach me.</p></div>
<div class="contact">
  <a class="addr" id="addr" href="mailto:{e(P["email"])}">{e(P["email"])}</a>
  <div class="actions"><a class="btn primary" href="mailto:{e(P["email"])}">Email me</a><button class="btn" type="button" id="copy" hidden>Copy address</button>{ext(P["linkedin"], "LinkedIn", icon=True)}{ext(P["github"], "GitHub", icon=True)}</div>
  <div class="toast" id="toast" role="status"></div>
</div>"""
    return page("/contact/", "Contact", f"Contact {P['name']}: {P['email']}, LinkedIn and GitHub.", body, active="/contact/")


def not_found():
    body = """<div class="phead"><h1>Page not found</h1><p>That page doesn't exist. It may have moved when the site became multi-page.</p></div>
<div class="actions"><a class="btn primary" href="/">Go to the home page</a><a class="btn" href="/projects/">See all projects</a></div>"""
    return page("/404.html", "Page not found", "This page doesn't exist.", body)


def write(rel, html):
    out = ROOT / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")


def main():
    if (ROOT / "projects").exists():
        shutil.rmtree(ROOT / "projects")          # drop pages for projects that were removed from the data
    write("index.html", home())
    write("projects/index.html", projects_index())
    for p in PROJECTS:
        write(f"projects/{p['slug']}/index.html", project_page(p))
    write("research/index.html", research())
    write("experience/index.html", experience())
    write("resumes/index.html", resumes())
    write("contact/index.html", contact())
    write("404.html", not_found())
    urls = ["/", "/projects/"] + [f"/projects/{p['slug']}/" for p in PROJECTS] + ["/research/", "/experience/", "/resumes/", "/contact/"]
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join(f"  <url><loc>{SITE}{u}</loc></url>\n" for u in urls) + "</urlset>\n")
    write("robots.txt", f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    print(f"built {len(urls)} pages")


if __name__ == "__main__":
    main()
