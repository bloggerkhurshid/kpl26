export interface PrintablePlayer {
  id: string;
  player_name: string;
  role?: string;
  player_category?: string;
  registration_number?: string;
  contact_number?: string;
  present_address?: string;
  team_id?: string | null;
  team_name?: string | null;
  team_short_code?: string | null;
  team_accent_color?: string | null;
  team_color?: string | null;
  teams?: {
    id?: string;
    name?: string;
    short_code?: string;
    accent_color?: string;
  } | null;
}

export interface PrintableTeam {
  id: string;
  name: string;
  short_code: string;
  accent_color?: string;
}

export function printPlayerRoster(
  players: PrintablePlayer[],
  categoryTitle: string = 'All Categories',
  allTeams: PrintableTeam[] = []
) {
  if (!players || players.length === 0) {
    alert('No players to print.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const getPlayerTeam = (p: PrintablePlayer): { name: string; short_code: string; color: string } | null => {
    if (p.teams && (p.teams.name || p.teams.short_code)) {
      return {
        name: p.teams.name || p.teams.short_code || '',
        short_code: p.teams.short_code || p.teams.name || '',
        color: p.teams.accent_color || p.team_accent_color || p.team_color || '#10b981',
      };
    }
    if (p.team_name || p.team_short_code) {
      return {
        name: p.team_name || p.team_short_code || '',
        short_code: p.team_short_code || p.team_name || '',
        color: p.team_accent_color || p.team_color || '#10b981',
      };
    }
    if (p.team_id && allTeams && allTeams.length > 0) {
      const found = allTeams.find(t => String(t.id) === String(p.team_id));
      if (found) {
        return {
          name: found.name || found.short_code || '',
          short_code: found.short_code || found.name || '',
          color: found.accent_color || '#10b981',
        };
      }
    }
    return null;
  };

  const assignedCount = players.filter(p => !!getPlayerTeam(p)).length;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>KPL Season 03 - Official Registered Players List</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #000;
      background: #fff;
      font-size: 11.5px;
      line-height: 1.35;
    }
    .no-print-bar {
      background: #0f172a;
      color: #fff;
      padding: 12px 20px;
      margin: -16px -16px 20px -16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #10b981;
    }
    .btn-print {
      background: #10b981;
      color: #0f172a;
      font-weight: 700;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }
    .btn-close {
      background: #334155;
      color: #fff;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      margin-left: 8px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .header h1 {
      margin: 0 0 3px;
      font-size: 19px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #000;
    }
    .header h2 {
      margin: 0 0 6px;
      font-size: 13px;
      font-weight: 700;
      color: #333;
      text-transform: uppercase;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #444;
      margin-top: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #475569;
      padding: 7px 6px;
      font-weight: 700;
      text-align: left;
    }
    th.center {
      text-align: center;
    }
    td {
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      vertical-align: middle;
      color: #0f172a;
    }
    td.center {
      text-align: center;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    tr.assigned-row td:first-child {
      position: relative;
    }
    .player-name {
      font-weight: 700;
      color: #000;
    }
    .role-badge {
      font-size: 10px;
      color: #64748b;
      margin-top: 1px;
    }
    .reg-id {
      font-weight: 700;
      font-family: monospace;
      font-size: 11px;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 10.5px;
    }
    .badge-foreign {
      background: #eff6ff !important;
      color: #1e40af !important;
      border: 1px solid #bfdbfe !important;
    }
    .badge-local-a {
      background: #fefce8 !important;
      color: #854d0e !important;
      border: 1px solid #fef08a !important;
    }
    .badge-local-b {
      background: #ecfeff !important;
      color: #155e75 !important;
      border: 1px solid #a5f3fc !important;
    }
    .badge-local {
      background: #ecfdf5 !important;
      color: #065f46 !important;
      border: 1px solid #a7f3d0 !important;
    }
    .team-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }
    .team-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }
    .unassigned-text {
      color: #94a3b8;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      margin-top: 36px;
      display: flex;
      justify-content: space-between;
      padding-top: 18px;
      border-top: 1px dashed #94a3b8;
      font-size: 11px;
      page-break-inside: avoid;
    }
    .sig-col {
      text-align: center;
    }
    .sig-line {
      width: 160px;
      border-bottom: 1px solid #000;
      margin-bottom: 6px;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0 !important;
      }
      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span>Ready to print <strong>${players.length} players</strong> (${assignedCount} assigned to teams)</span>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">Close</button>
    </div>
  </div>

  <div class="header">
    <h1>KHORAGHAT PREMIER LEAGUE — SEASON 03 (2026)</h1>
    <h2>OFFICIAL REGISTERED PLAYERS LIST</h2>
    <div class="meta-bar">
      <span>Category: <strong>${categoryTitle}</strong></span>
      <span>Total Players: <strong>${players.length}</strong> (${assignedCount} Assigned)</span>
      <span>Date: <strong>${currentDate}</strong></span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="center" style="width: 45px;">SL NO</th>
        <th class="center" style="width: 90px;">REG ID</th>
        <th>PLAYER NAME</th>
        <th>ADDRESS</th>
        <th class="center" style="width: 110px;">MOBILE NO</th>
        <th class="center" style="width: 95px;">LOCAL / FOREIGN</th>
        <th class="center" style="width: 120px;">ASSIGNED TEAM</th>
      </tr>
    </thead>
    <tbody>
      ${players.map((p, i) => {
        const cat = (p.player_category || '').toLowerCase();
        const isForeign = cat.includes('foreign');
        const isLocalA = cat.includes('local') && (cat.includes('a') || cat.includes('(a)') || cat.includes('grade a') || cat.endsWith(' a'));
        const isLocalB = cat.includes('local') && (cat.includes('b') || cat.includes('(b)') || cat.includes('grade b') || cat.endsWith(' b'));
        const categoryLabel = isForeign ? 'Foreign' : isLocalA ? 'Local (A)' : isLocalB ? 'Local (B)' : 'Local';
        const categoryClass = isForeign ? 'badge-foreign' : isLocalA ? 'badge-local-a' : isLocalB ? 'badge-local-b' : 'badge-local';
        const team = getPlayerTeam(p);
        const teamColor = team?.color || '#10b981';

        return `
        <tr ${team ? `class="assigned-row" style="border-left: 4px solid ${teamColor};"` : ''}>
          <td class="center" style="font-weight: 600;">${i + 1}</td>
          <td class="center reg-id">${p.registration_number || '—'}</td>
          <td>
            <div class="player-name">${p.player_name || '—'}</div>
            ${p.role ? `<div class="role-badge">${p.role}</div>` : ''}
          </td>
          <td>${p.present_address || '—'}</td>
          <td class="center" style="font-weight: 600;">${p.contact_number || '—'}</td>
          <td class="center">
            <span class="badge ${categoryClass}">
              ${categoryLabel}
            </span>
          </td>
          <td class="center">
            ${team ? `
              <span class="team-pill" style="background: ${teamColor}18 !important; color: ${teamColor} !important; border: 1.5px solid ${teamColor} !important;">
                <span class="team-dot" style="background: ${teamColor} !important;"></span>
                <span>${team.name || team.short_code}</span>
              </span>
            ` : `
              <span class="unassigned-text">Unassigned</span>
            `}
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div class="sig-col">
      <div class="sig-line"></div>
      <span>Prepared By</span>
    </div>
    <div class="sig-col">
      <div class="sig-line"></div>
      <span>Verified By</span>
    </div>
    <div class="sig-col">
      <div class="sig-line"></div>
      <span>KPL Committee Authority</span>
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  <\/script>
</body>
</html>`;

  // Try opening standalone window first (cleanest experience)
  const printWindow = window.open('', '_blank', 'width=1050,height=850');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    return;
  }

  // Fallback: If popups are blocked, use hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 500);
  }
}
