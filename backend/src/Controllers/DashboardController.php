<?php
namespace Kpl\Controllers;

use Kpl\Models\Team;
use Kpl\Models\Player;
use Kpl\Models\Payment;
use Kpl\Utils\Response;
use Database;

/**
 * Controller handling Admin Dashboard overview statistics
 */
class DashboardController {

    public function index(): void {
        try {
            $db = Database::getConnection();

            $activeTeamsCount = Team::all('active');
            $activePlayersCount = Player::count('active');
            $totalRevenue = Payment::totalRevenue();

            // Pending team registrations count
            $stmtPendingTeams = $db->prepare("SELECT COUNT(*) as cnt FROM team_registrations WHERE status = 'pending'");
            $stmtPendingTeams->execute();
            $pendingTeamsCount = (int)($stmtPendingTeams->fetch()['cnt'] ?? 0);

            // Pending player registrations count (from players table, fallback to player_registrations)
            $stmtPendingPlayers = $db->prepare("SELECT COUNT(*) as cnt FROM players WHERE status = 'pending' OR approval = 'pending'");
            $stmtPendingPlayers->execute();
            $pendingPlayersCount = (int)($stmtPendingPlayers->fetch()['cnt'] ?? 0);
            if ($pendingPlayersCount === 0) {
                try {
                    $stmtOldPending = $db->prepare("SELECT COUNT(*) as cnt FROM player_registrations WHERE status = 'pending'");
                    $stmtOldPending->execute();
                    $pendingPlayersCount = (int)($stmtOldPending->fetch()['cnt'] ?? 0);
                } catch (\Exception $ignored) {}
            }

            // Auction Eligible Count
            $stmtAuction = $db->prepare("SELECT COUNT(*) as cnt FROM players WHERE auction_eligible = 1 AND status = 'active'");
            $stmtAuction->execute();
            $auctionEligibleCount = (int)($stmtAuction->fetch()['cnt'] ?? 0);

            // Recent teams
            $stmtRecentTeams = $db->prepare("SELECT id, team_name, status, created_at FROM team_registrations ORDER BY created_at DESC LIMIT 5");
            $stmtRecentTeams->execute();
            $recentTeams = $stmtRecentTeams->fetchAll() ?: [];

            // Recent players (check self-registered / pending players in players table first)
            $stmtRecentPlayers = $db->prepare("SELECT id, player_name, status, created_at FROM players WHERE registered_by LIKE '%self%' OR status = 'pending' ORDER BY created_at DESC LIMIT 5");
            $stmtRecentPlayers->execute();
            $recentPlayers = $stmtRecentPlayers->fetchAll() ?: [];
            if (empty($recentPlayers)) {
                try {
                    $stmtRecentPlayersOld = $db->prepare("SELECT id, player_name, status, created_at FROM player_registrations ORDER BY created_at DESC LIMIT 5");
                    $stmtRecentPlayersOld->execute();
                    $recentPlayers = $stmtRecentPlayersOld->fetchAll() ?: [];
                } catch (\Exception $ignored) {}
            }

            Response::json([
                "status" => "success",
                "stats" => [
                    "active_teams" => count($activeTeamsCount),
                    "active_players" => $activePlayersCount,
                    "total_revenue" => $totalRevenue,
                    "pending_teams" => $pendingTeamsCount,
                    "pending_players" => $pendingPlayersCount,
                    "auction_eligible" => $auctionEligibleCount
                ],
                "recent_team_registrations" => $recentTeams,
                "recent_player_registrations" => $recentPlayers
            ]);

        } catch (\Exception $e) {
            Response::error("Failed to fetch dashboard metrics: " . $e->getMessage(), 500);
        }
    }
}
