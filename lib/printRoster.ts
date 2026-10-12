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
        <th class="center" style="width: 125px;">CATEGORY</th>
        <th class="center" style="width: 120px;">ASSIGNED TEAM</th>
      </tr>
    </thead>
    <tbody>
      ${players.map((p, i) => {
        const cat = (p.player_category || '').toLowerCase();
        const isForeign = cat.includes('foreign');
        const isLocalB = !isForeign && (cat.includes('b') || cat.includes('-b') || cat.includes('(b)') || cat.includes('grade b') || cat.endsWith(' b'));
        const categoryLabel = isForeign ? 'Foreigner' : isLocalB ? 'Local-B' : 'Local-A';
        const categoryClass = isForeign ? 'badge-foreign' : isLocalB ? 'badge-local-b' : 'badge-local-a';
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

export function printTeamDetails(
  teams: any[],
  players: any[] = []
) {
  if (!teams || teams.length === 0) {
    alert('No teams available to print.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const getTeamRetain = (team: any) => {
    if (!players || !players.length) return null;
    const squad = players.filter(p => String(p.team_id) === String(team.id));
    
    // 1. Role or category explicitly mentioning retain
    const retainPlayer = squad.find(p => 
      (p.role || '').toLowerCase().includes('retain') || 
      (p.player_category || '').toLowerCase().includes('retain')
    );
    if (retainPlayer) return retainPlayer;

    // 2. Fallback to captain match if defined
    const capName = (team.captain_name || team.captain || '').trim().toLowerCase();
    if (capName) {
      const match = squad.find(p => (p.player_name || '').trim().toLowerCase() === capName);
      if (match) return match;
      const anyMatch = players.find(p => (p.player_name || '').trim().toLowerCase() === capName);
      if (anyMatch) return anyMatch;
    }

    return null;
  };

  const getTeamOwner = (team: any) => {
    const ownerName = (team.owner_name || team.owner || '').trim() || '—';
    const ownerContact = (team.owner_contact || team.phone || '').trim();
    const squad = players ? players.filter(p => String(p.team_id) === String(team.id)) : [];
    const isPlayingOwner = squad.some(p => 
      (p.role || '').toLowerCase().includes('owner') || 
      (ownerName !== '—' && (p.player_name || '').trim().toLowerCase() === ownerName.toLowerCase())
    );
    return { name: ownerName, contact: ownerContact, isPlaying: isPlayingOwner };
  };

  const retainedCount = teams.filter(t => !!getTeamRetain(t)).length;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>KPL Season 03 - Official Team Details (Team, Owner & Retain Player)</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
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
      padding: 18px;
      color: #0f172a;
      background: #fff;
      font-size: 12px;
      line-height: 1.4;
    }
    .no-print-bar {
      background: #0f172a;
      color: #fff;
      padding: 12px 20px;
      margin: -18px -18px 22px -18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #3b82f6;
    }
    .btn-print {
      background: #3b82f6;
      color: #ffffff;
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
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #0f172a;
    }
    .header h2 {
      margin: 0 0 6px;
      font-size: 14px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      color: #475569;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #475569;
      padding: 9px 8px;
      font-weight: 800;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    th.center {
      text-align: center;
    }
    td {
      border: 1px solid #cbd5e1;
      padding: 8px 9px;
      vertical-align: middle;
      color: #0f172a;
    }
    td.center {
      text-align: center;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .team-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }
    .team-color-indicator {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      display: inline-block;
      flex-shrink: 0;
      border: 1px solid rgba(0,0,0,0.15);
    }
    .team-name {
      font-weight: 800;
      font-size: 13px;
      color: #0f172a;
    }
    .team-code {
      font-size: 10.5px;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .owner-name {
      font-weight: 700;
      font-size: 12.5px;
      color: #0f172a;
    }
    .owner-contact {
      font-size: 11px;
      color: #475569;
      font-family: monospace;
      margin-top: 2px;
    }
    .tag-playing-owner {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: 800;
      margin-top: 3px;
      text-transform: uppercase;
    }
    .retain-box {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .retain-name {
      font-weight: 800;
      font-size: 12.5px;
      color: #047857;
    }
    .retain-meta {
      font-size: 10.5px;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .tag-retain {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 9.5px;
      text-transform: uppercase;
    }
    .no-retain {
      color: #94a3b8;
      font-style: italic;
      font-size: 11px;
    }
    .summary-cards {
      margin-top: 18px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      page-break-inside: avoid;
    }
    .summary-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      text-align: center;
    }
    .summary-card-num {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
    }
    .summary-card-lbl {
      font-size: 10.5px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .footer {
      margin-top: 38px;
      display: flex;
      justify-content: space-between;
      padding-top: 20px;
      border-top: 1px dashed #94a3b8;
      font-size: 11px;
      page-break-inside: avoid;
    }
    .sig-col {
      text-align: center;
    }
    .sig-line {
      width: 170px;
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
    <span>Ready to print <strong>${teams.length} Franchises</strong> (${retainedCount} Retained Players assigned)</span>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">Close</button>
    </div>
  </div>

  <div class="header">
    <h1>KHORAGHAT PREMIER LEAGUE — SEASON 03 (2026)</h1>
    <h2>${teams.length === 1 ? `${(teams[0].name || 'FRANCHISE').toUpperCase()} — TEAM DETAILS & ROSTER` : 'OFFICIAL FRANCHISE TEAMS, OWNERS & RETAINED PLAYERS'}</h2>
    <div class="meta-bar">
      <span>Total Franchises: <strong>${teams.length} ${teams.length === 1 ? 'Team' : 'Teams'}</strong></span>
      <span>Retained Players: <strong>${retainedCount} / ${teams.length}</strong></span>
      <span>Official Record Date: <strong>${currentDate}</strong></span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="center" style="width: 45px;">SL NO</th>
        <th style="width: 32%;">TEAM NAME</th>
        <th style="width: 33%;">FRANCHISE OWNER</th>
        <th style="width: 35%;">RETAIN PLAYER</th>
      </tr>
    </thead>
    <tbody>
      ${teams.map((t, i) => {
        const teamColor = t.accent_color || t.color || '#3b82f6';
        const owner = getTeamOwner(t);
        const retainPlayer = getTeamRetain(t);
        const squad = players ? players.filter(p => String(p.team_id) === String(t.id)) : [];

        return `
        <tr style="border-left: 4px solid ${teamColor};">
          <td class="center" style="font-weight: 700;">${i + 1}</td>
          <td>
            <div class="team-badge">
              <span class="team-color-indicator" style="background: ${teamColor};"></span>
              <div>
                <div class="team-name">${t.name || 'Unnamed Team'}</div>
                <div class="team-code">Code: ${t.short_code || '—'} ${squad.length > 0 ? `• Squad: ${squad.length}` : ''}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="owner-name">${owner.name}</div>
            ${owner.contact ? `<div class="owner-contact">📞 ${owner.contact}</div>` : ''}
            ${owner.isPlaying ? `<span class="tag-playing-owner">Franchise Owner (Playing)</span>` : ''}
          </td>
          <td>
            ${retainPlayer ? `
              <div class="retain-box">
                <div class="retain-name">★ ${retainPlayer.player_name}</div>
                <div class="retain-meta">
                  <span class="tag-retain">Retained ₹1,500</span>
                  ${retainPlayer.registration_number ? `<span>Reg: <strong>${retainPlayer.registration_number}</strong></span>` : ''}
                  ${retainPlayer.contact_number ? `<span>• 📞 ${retainPlayer.contact_number}</span>` : ''}
                </div>
              </div>
            ` : `
              <span class="no-retain">— None / Open Retain Slot —</span>
            `}
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  ${teams.length === 1 && players ? (() => {
    const singleTeam = teams[0];
    const squad = players.filter(p => String(p.team_id) === String(singleTeam.id));
    if (squad.length === 0) return '';
    return `
      <div style="margin-top: 24px;">
        <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
          Official Squad Roster (${squad.length} Players)
        </h3>
        <table>
          <thead>
            <tr>
              <th class="center" style="width: 45px;">SL</th>
              <th class="center" style="width: 85px;">REG ID</th>
              <th>PLAYER NAME</th>
              <th class="center" style="width: 120px;">CATEGORY</th>
              <th class="center" style="width: 110px;">ROLE</th>
              <th class="center" style="width: 110px;">MOBILE</th>
            </tr>
          </thead>
          <tbody>
            ${squad.map((sp, idx) => `
              <tr>
                <td class="center" style="font-weight: 700;">${idx + 1}</td>
                <td class="center" style="font-family: monospace; font-weight: 700;">${sp.registration_number || '—'}</td>
                <td style="font-weight: 700;">${sp.player_name || '—'}</td>
                <td class="center">${sp.player_category || 'Local'}</td>
                <td class="center">${sp.role || 'Player'}</td>
                <td class="center" style="font-family: monospace;">${sp.contact_number || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  })() : ''}

  <div class="summary-cards">
    <div class="summary-card">
      <div class="summary-card-num">${teams.length}</div>
      <div class="summary-card-lbl">${teams.length === 1 ? 'Selected Team' : 'Total Teams'}</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-num" style="color: #047857;">${retainedCount}</div>
      <div class="summary-card-lbl">Retained Players</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-num" style="color: #d97706;">${teams.length - retainedCount}</div>
      <div class="summary-card-lbl">Open Retain Slots</div>
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

  // Try opening standalone window first
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

