<?php
/**
 * Dashboard Metrics & Summary REST API
 * Khoraghat Premier League (KPL) PHP Backend
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed", 405);
}

try {
    // 1. Teams count
    $stmtTeams = $db->prepare("SELECT COUNT(*) as cnt FROM teams WHERE status = 'active'");
    $stmtTeams->execute();
    $activeTeamsCount = (int)$stmtTeams->fetch()['cnt'];

    // 2. Players count
    $stmtPlayers = $db->prepare("SELECT COUNT(*) as cnt FROM players WHERE status = 'active'");
    $stmtPlayers->execute();
    $activePlayersCount = (int)$stmtPlayers->fetch()['cnt'];

    // 3. Total Payments Revenue
    $stmtPayments = $db->prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'completed'");
    $stmtPayments->execute();
    $totalRevenue = (float)($stmtPayments->fetch()['total'] ?? 0);

    // 4. Pending team registrations
    $stmtPendingTeams = $db->prepare("SELECT COUNT(*) as cnt FROM team_registrations WHERE status = 'pending'");
    $stmtPendingTeams->execute();
    $pendingTeamsCount = (int)$stmtPendingTeams->fetch()['cnt'];

    // 5. Pending player registrations
    $stmtPendingPlayers = $db->prepare("SELECT COUNT(*) as cnt FROM player_registrations WHERE status = 'pending'");
    $stmtPendingPlayers->execute();
    $pendingPlayersCount = (int)$stmtPendingPlayers->fetch()['cnt'];

    // 6. Auction Eligible Count
    $stmtAuction = $db->prepare("SELECT COUNT(*) as cnt FROM players WHERE auction_eligible = 1 AND status = 'active'");
    $stmtAuction->execute();
    $auctionEligibleCount = (int)$stmtAuction->fetch()['cnt'];

    // 7. Recent teams
    $stmtRecentTeams = $db->prepare("SELECT id, team_name, status, created_at FROM team_registrations ORDER BY created_at DESC LIMIT 5");
    $stmtRecentTeams->execute();
    $recentTeams = $stmtRecentTeams->fetchAll();

    // 8. Recent players
    $stmtRecentPlayers = $db->prepare("SELECT id, player_name, status, created_at FROM player_registrations ORDER BY created_at DESC LIMIT 5");
    $stmtRecentPlayers->execute();
    $recentPlayers = $stmtRecentPlayers->fetchAll();

    sendJson([
        "status" => "success",
        "stats" => [
            "active_teams" => $activeTeamsCount,
            "active_players" => $activePlayersCount,
            "total_revenue" => $totalRevenue,
            "pending_teams" => $pendingTeamsCount,
            "pending_players" => $pendingPlayersCount,
            "auction_eligible" => $auctionEligibleCount
        ],
        "recent_team_registrations" => $recentTeams,
        "recent_player_registrations" => $recentPlayers
    ]);

} catch (Exception $e) {
    sendError("Failed to fetch dashboard metrics: " . $e->getMessage(), 500);
}
