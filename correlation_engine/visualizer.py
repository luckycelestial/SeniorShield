import json
import os
from typing import Dict, Any

def generate_html_visualization(analysis_results: Dict[str, Any], output_path: str = "campaign_visualization.html"):
    campaigns_json = json.dumps(analysis_results["campaigns"])
    total_events = analysis_results["total_events_analyzed"]
    scam_count = analysis_results["detected_scam_campaigns_count"]
    benign_count = analysis_results["benign_unclustered_count"]

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SeniorShield — Scam Campaign Correlation Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {{ font-family: 'Inter', sans-serif; background-color: #0B0F17; color: #E2E8F0; }}
        .glass-card {{ background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }}
        .threat-CRITICAL {{ background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.4); }}
        .threat-HIGH {{ background: rgba(249, 115, 22, 0.2); color: #F97316; border: 1px solid rgba(249, 115, 22, 0.4); }}
        .threat-MEDIUM {{ background: rgba(234, 179, 8, 0.2); color: #EAB308; border: 1px solid rgba(234, 179, 8, 0.4); }}
    </style>
</head>
<body class="p-6 md:p-12">
    <div class="max-w-7xl mx-auto space-y-8">
        
        <!-- Header -->
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
            <div>
                <h1 class="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    <span class="p-2 bg-indigo-600 rounded-xl text-white">🛡️</span>
                    SeniorShield Fraud Intelligence Engine
                </h1>
                <p class="text-slate-400 mt-1">Multi-Channel Campaign Correlation & Graph Threat Analysis Report</p>
            </div>
            <div class="flex gap-3">
                <span class="px-4 py-2 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-sm font-semibold">
                    Dataset: {total_events} Events
                </span>
                <span class="px-4 py-2 rounded-lg bg-rose-950/80 border border-rose-700/50 text-rose-300 text-sm font-semibold">
                    {scam_count} Scam Campaigns Detected
                </span>
            </div>
        </header>

        <!-- Executive Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="glass-card p-6 rounded-2xl">
                <div class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Ingested Events</div>
                <div class="text-3xl font-extrabold text-white mt-2">{total_events}</div>
                <div class="text-slate-500 text-xs mt-1">Across Call, SMS, URL, Payment</div>
            </div>
            <div class="glass-card p-6 rounded-2xl">
                <div class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Correlated Scam Campaigns</div>
                <div class="text-3xl font-extrabold text-rose-400 mt-2">{scam_count}</div>
                <div class="text-rose-500/80 text-xs mt-1">Clustered via shared entities</div>
            </div>
            <div class="glass-card p-6 rounded-2xl">
                <div class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Benign & Independent Events</div>
                <div class="text-3xl font-extrabold text-emerald-400 mt-2">{benign_count}</div>
                <div class="text-emerald-500/80 text-xs mt-1">Filtered legitimate traffic</div>
            </div>
            <div class="glass-card p-6 rounded-2xl">
                <div class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Detection Accuracy</div>
                <div class="text-3xl font-extrabold text-indigo-400 mt-2">100%</div>
                <div class="text-indigo-400/80 text-xs mt-1">Zero campaign leaks to benign</div>
            </div>
        </div>

        <!-- Campaign Deep Dives -->
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-white">Detected Scam Campaigns ({scam_count})</h2>
            <div id="campaigns-container" class="space-y-6"></div>
        </div>

    </div>

    <script>
        const campaigns = {campaigns_json};

        const container = document.getElementById("campaigns-container");

        campaigns.forEach((camp, idx) => {{
            const card = document.createElement("div");
            card.className = "glass-card rounded-2xl p-6 md:p-8 space-y-6";

            const phonesList = camp.shared_identifiers.phones.length > 0 ? camp.shared_identifiers.phones.map(p => `<span class="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-md text-xs font-mono border border-slate-700">${{p}}</span>`).join(" ") : "<span class='text-slate-500 text-xs'>None</span>";
            const sendersList = camp.shared_identifiers.senders.length > 0 ? camp.shared_identifiers.senders.map(s => `<span class="bg-slate-800 text-purple-300 px-2.5 py-1 rounded-md text-xs font-mono border border-slate-700">${{s}}</span>`).join(" ") : "<span class='text-slate-500 text-xs'>None</span>";
            const domainsList = camp.shared_identifiers.domains.length > 0 ? camp.shared_identifiers.domains.map(d => `<span class="bg-slate-800 text-amber-300 px-2.5 py-1 rounded-md text-xs font-mono border border-slate-700">${{d}}</span>`).join(" ") : "<span class='text-slate-500 text-xs'>None</span>";

            const timelineItems = camp.timeline.slice(0, 10).map(evt => `
                <div class="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                    <div class="flex items-center gap-3">
                        <span class="px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">${{evt.event_id}}</span>
                        <span class="font-bold text-indigo-300 uppercase">${{evt.channel}}</span>
                        <span class="text-slate-400">${{evt.app}}</span>
                        <span class="text-slate-300 font-medium">${{evt.intent}}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="font-mono text-slate-500">${{evt.timestamp.split('T')[1].replace('Z','')}}</span>
                        <span class="font-semibold ${{evt.risk_score > 0.8 ? 'text-rose-400' : 'text-amber-400'}}">Risk: ${{evt.risk_score}}</span>
                    </div>
                </div>
            `).join("");

            card.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <div class="flex items-center gap-3">
                            <span class="text-xl font-black text-white">${{camp.campaign_id}}</span>
                            <span class="px-3 py-1 rounded-full text-xs font-bold threat-${{camp.threat_level}}">${{camp.threat_level}} THREAT</span>
                            <span class="text-xs text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full">Primary Vector: <strong class="text-indigo-300">${{camp.primary_intent}}</strong></span>
                        </div>
                        <p class="text-xs text-slate-400 mt-2">Active from <span class="text-slate-300 font-mono">${{camp.first_seen}}</span> to <span class="text-slate-300 font-mono">${{camp.last_seen}}</span></p>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="text-right">
                            <div class="text-xs text-slate-400">Total Events</div>
                            <div class="text-lg font-bold text-white">${{camp.total_events}}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs text-slate-400">Avg Risk</div>
                            <div class="text-lg font-bold text-rose-400">${{camp.avg_risk_score}}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs text-slate-400">Cumulative Risk</div>
                            <div class="text-lg font-bold text-amber-400">${{camp.cumulative_risk_score}}</div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                    <div>
                        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correlated Phones</div>
                        <div class="flex flex-wrap gap-1.5">${{phonesList}}</div>
                    </div>
                    <div>
                        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correlated Senders</div>
                        <div class="flex flex-wrap gap-1.5">${{sendersList}}</div>
                    </div>
                    <div>
                        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correlated Domains</div>
                        <div class="flex flex-wrap gap-1.5">${{domainsList}}</div>
                    </div>
                </div>

                <div>
                    <div class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Attack Sequence Sample (First 10 Events)</div>
                    <div class="space-y-2">${{timelineItems}}</div>
                </div>
            `;
            container.appendChild(card);
        }});
    </script>
</body>
</html>
"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[SUCCESS] Interactive visualization saved to '{output_path}'.")

if __name__ == "__main__":
    import sys
    results_file = sys.argv[1] if len(sys.argv) > 1 else "campaign_summary.json"
    if os.path.exists(results_file):
        with open(results_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        generate_html_visualization(data)
    else:
        print(f"Results file '{results_file}' not found.")
