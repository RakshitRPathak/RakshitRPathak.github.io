# rakshitrpathak.github.io

Personal site of **Rakshit Ratan Pathak**, final-year B.Tech (Computer Science and Business Systems) at VIT Vellore.

**Live:** https://rakshitrpathak.github.io

I build compilers and GPU tooling in C++, ML systems judged by multi-seed results, and Java and backend systems where correctness under failure is the point. Looking for six-month internships from January 2027.

## What's on the site

The site has three layers: an overview, a section page, and a page for each project.

| Section | Contents |
| --- | --- |
| Overview | Summary and the three layers of work (systems and compilers, ML systems, software engineering) |
| Work | 17 projects, filterable by layer; each has its own page with the problem, a pipeline diagram, results, caveats and links |
| Research and patents | 6 patent applications (5 published) and 3 IEEE Access manuscripts |
| Experience | aiDataWorks, THDC India Limited, education, leadership, certifications |
| Resumes | One-page PDFs for software engineering, AI/ML and compiler roles |
| Contact | Email, GitHub, LinkedIn |

Every project page says where its numbers come from (real data, simulated data or tests) and what has not been verified yet.

## Projects

| Project | Layer | Repository |
| --- | --- | --- |
| PTXForge: GPU kernel autotuner and MLIR passes (in progress) | Systems | coming soon |
| minic: a compiler in C++17 | Systems | [minic](https://github.com/RakshitRPathak/minic) |
| cuda-gpu-bench: CUDA kernels and analysis | Systems | [cuda-gpu-bench](https://github.com/RakshitRPathak/cuda-gpu-bench) |
| Opinion Lineage System | ML | [OpinionLineage-OLS](https://github.com/RakshitRPathak/OpinionLineage-OLS), [Opinion-lineage-system](https://github.com/RakshitRPathak/Opinion-lineage-system) |
| RailConflict-PSCL | ML | [RailConflict-PSCL](https://github.com/RakshitRPathak/RailConflict-PSCL) |
| TrustDecay-TKG | ML | [TrustDecay-TKG](https://github.com/RakshitRPathak/TrustDecay-TKG) |
| VeriCloud | ML | [VeriCloud](https://github.com/RakshitRPathak/VeriCloud) |
| Risk-Constrained Emergency Control | ML | [repo](https://github.com/RakshitRPathak/Risk-Constrained-Emergency-Control-System), [live demo](https://tarp-ml.vercel.app/) |
| Wildfire Prediction and Response | ML | [repo](https://github.com/RakshitRPathak/Wildfire-prediction-ml-model) |
| Mine Tremor Detection | ML | [repo](https://github.com/RakshitRPathak/Mining-tremor-detection-Patent-cum-grant) |
| agentic-bug-repair: autonomous bug-fixing agent | Software engineering | [agentic-bug-repair](https://github.com/RakshitRPathak/agentic-bug-repair) |
| mini-kv-store: crash-safe LSM-tree store | Software engineering | [mini-kv-store](https://github.com/RakshitRPathak/mini-kv-store) |
| system-design-primitives | Software engineering | [system-design-primitives](https://github.com/RakshitRPathak/system-design-primitives) |
| dsa-patterns | Software engineering | [dsa-patterns](https://github.com/RakshitRPathak/dsa-patterns) |
| Healthcare Appointment Manager | Software engineering | [repo](https://github.com/RakshitRPathak/Healthcare-Appointment-Follow-up-Manager) |
| Inventory Management System | Software engineering | [repo](https://github.com/RakshitRPathak/Inventory-Management-System) |
| PDF-to-Audio Generator | Software engineering | [repo](https://github.com/RakshitRPathak/Pdf-Audio-converter) |

## How it's built

One static `index.html` with no build step and no framework: plain HTML, CSS and JavaScript. Pages are hash routes (`#work`, `#p-minic`, `#research`), so every view has its own shareable link and the site runs on GitHub Pages as is. It follows the system light or dark theme and works at phone width.

To edit project details, change the `PROJECTS` array near the top of the script in `index.html`.

```
index.html     the whole site
resume/        one-page PDF resumes
404.html       sends unknown paths back to the home page
.nojekyll      tells GitHub Pages to serve files as they are
```

## Contact

rrpathak.0007@gmail.com · [LinkedIn](https://www.linkedin.com/in/rakshit-ratan-pathak-20a32228a) · [GitHub](https://github.com/RakshitRPathak)
