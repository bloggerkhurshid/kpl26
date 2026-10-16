'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { kplApi, getImageUrl } from '@/lib/api';
import {
  Gavel, Play, Square, UserCheck, UserX, ExternalLink,
  CheckCircle2, AlertCircle, Loader2, Trophy, Users, DollarSign, Search, X,
  Radio, RefreshCw, Flame, ArrowRight, Shield, Edit3, Edit2, Printer,
  Clock, Zap, Power
} from 'lucide-react';
import { printTeamDetails, searchMatchesPlayer, getPlayerAuctionPart, compareRegistrationNumbers, AuctionPartKey } from '@/lib/printRoster';

interface SoldTimerState {
  playerId: string;
  playerName: string;
  teamName: string;
  soldPrice: number;
  secondsRemaining: number;
}

interface UnsoldTimerState {
  playerId: string;
  playerName: string;
  secondsRemaining: number;
}

interface Team {
  id: string;
  name: string;
  short_code: string;
  accent_color: string;
  budget?: number | string;
  spent?: number | string;
  squad_count?: number;
}

interface Player {
  id: string;
  player_name: string;
  role: string;
  age: number | null;
  base_price: number;
  sold_price: number | null;
  auction_eligible: boolean | number | string;
  status: string;
  team_id: string | null;
  photo?: string | null;
  player_category?: string;
  registration_number?: string | null;
  contact_number?: string | null;
  teams?: Team | null;
}

interface AuctionConfig {
  is_active: boolean;
  is_ended?: boolean;
  current_player_id: string | null;
  notes: string;
}

export default function AuctionPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [auctionConfig, setAuctionConfig] = useState<AuctionConfig>({
    is_active: true,
    is_ended: false,
    current_player_id: null,
    notes: 'KPL Season 3 Live Auction',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sellModal, setSellModal] = useState<Player | null>(null);
  const [sellForm, setSellForm] = useState({ team_id: '', sold_price: '' });
  const [editPriceModal, setEditPriceModal] = useState<Player | null>(null);
  const [editPriceForm, setEditPriceForm] = useState({ team_id: '', sold_price: '' });
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPart, setSelectedPart] = useState<AuctionPartKey>('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedPrintTeamId, setSelectedPrintTeamId] = useState<string>('all');
  const [soldTimer, setSoldTimer] = useState<SoldTimerState | null>(null);
  const [unsoldTimer, setUnsoldTimer] = useState<UnsoldTimerState | null>(null);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [endingAuction, setEndingAuction] = useState(false);
  const lastLocalActionRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
    // Instant safe client hydration from cache (0ms)
    const cachedP = kplApi.getCachedPlayers({ status: 'active', limit: 1000 });
    const cachedT = kplApi.getCachedTeams('active');
    if (cachedP && cachedP.length > 0) {
      setPlayers(cachedP as Player[]);
      setLoading(false);
    }
    if (cachedT && cachedT.length > 0) {
      setTeams(cachedT as Team[]);
    }
  }, []);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleEndAuction() {
    setEndingAuction(true);
    try {
      const payload = {
        is_active: false,
        is_ended: true,
        current_player_id: null,
        notes: 'Auction ended',
      };
      await Promise.all([
        fetch('/api/auction/config', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        kplApi.updateAuctionConfig(payload),
      ]);

      setAuctionConfig(prev => ({
        ...prev,
        is_active: false,
        is_ended: true,
        current_player_id: null,
        notes: 'Auction ended',
      }));
      setShowEndDialog(false);
      showToast('Auction ended. Live viewers redirected to results page.');
      window.open('/auction/ended', '_blank');
    } catch (err: any) {
      showToast(err.message || 'Failed to end auction', 'error');
    } finally {
      setEndingAuction(false);
    }
  }

  // Load both roster and current live auction configuration
  const loadData = useCallback(async (quiet: boolean = false) => {
    if (!quiet && players.length === 0) setLoading(true);
    setIsSyncing(true);
    try {
      const [pRes, tRes, cRes] = await Promise.all([
        kplApi.getPlayers({ status: 'active', limit: 1000 }, { forceRefresh: true }),
        kplApi.getTeams('active'),
        kplApi.getAuctionConfig(),
      ]);

      const loadedPlayers: Player[] = pRes?.data || pRes || [];
      const loadedTeams: Team[] = tRes?.data || tRes || [];

      // Re-map teams object onto players if missing
      const teamMap = new Map<string, Team>();
      loadedTeams.forEach(t => teamMap.set(String(t.id), t));

      const enrichedPlayers = loadedPlayers.map(p => {
        if (p.team_id && (!p.teams || !p.teams.name)) {
          return { ...p, teams: teamMap.get(String(p.team_id)) || p.teams };
        }
        return p;
      });

      // Keep optimistic sold/unsold state so delayed database reads never revert local admin actions
      setPlayers(prev => {
        if (prev.length === 0) return enrichedPlayers;
        const prevMap = new Map(prev.map(p => [String(p.id), p]));
        return enrichedPlayers.map(p => {
          const localP = prevMap.get(String(p.id));
          if (!localP) return p;

          const localIsSold = Boolean(localP.team_id);
          const localIsUnsold = !localIsSold && (
            localP.auction_eligible === 0 ||
            localP.auction_eligible === '0' ||
            localP.auction_eligible === false
          );

          // If locally sold, preserve sold status unless remote has also assigned a team
          if (localIsSold && !p.team_id) {
            return {
              ...p,
              team_id: localP.team_id,
              sold_price: localP.sold_price,
              auction_eligible: 0,
              teams: localP.teams || p.teams,
            };
          }
          // If locally marked unsold (auction_eligible: 0), preserve unsold status unless remote has assigned a team
          if (localIsUnsold && !p.team_id) {
            return {
              ...p,
              auction_eligible: 0,
            };
          }
          return p;
        });
      });
      setTeams(loadedTeams);

      if (cRes) {
        // Protect local admin action: NEVER overwrite active auction block if locally modified in last 60 seconds
        const isRecentlyModifiedLocally = Date.now() - lastLocalActionRef.current < 60000;
        setAuctionConfig(prev => {
          const chosenPlayerId = isRecentlyModifiedLocally ? prev.current_player_id : (cRes.current_player_id || null);
          return {
            is_active: cRes.current_player_id ? true : Boolean(cRes.is_active),
            is_ended: Boolean(cRes.is_ended),
            current_player_id: chosenPlayerId,
            notes: cRes.notes || prev.notes || 'KPL Season 3 Live Auction',
          };
        });
      }
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error(err);
      if (!quiet) {
        showToast(err.message || 'Failed to load auction data', 'error');
      }
    } finally {
      if (!quiet) setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  // Initial load once on component mount (NO periodic background auto-refresh to prevent interrupting admin)
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle auction session state (Start / Stop)
  async function toggleAuctionSession() {
    setSaving(true);
    lastLocalActionRef.current = Date.now();
    const newActive = !auctionConfig.is_active;
    let curP = players.find(x => String(x.id) === String(auctionConfig.current_player_id));
    const curIsSold = Boolean(curP && curP.team_id);
    let validCurPlayerId = curIsSold ? '' : (auctionConfig.current_player_id || '');

    // If starting auction and no player is currently on the block, auto-select the first eligible candidate
    if (newActive && !validCurPlayerId && sortedPartEligible.length > 0) {
      const firstCandidate = sortedPartEligible.find(p => !p.team_id);
      if (firstCandidate) {
        validCurPlayerId = String(firstCandidate.id);
        curP = firstCandidate;
      }
    }

    try {
      await Promise.all([
        kplApi.updateAuctionConfig({
          is_active: newActive,
          is_ended: false,
          status: newActive && validCurPlayerId ? 'BIDDING' : 'IDLE',
          current_player_id: validCurPlayerId || null,
          player: curP || null,
          notes: auctionConfig.notes,
        }),
        kplApi.saveContentSettings({
          auction_is_active: String(newActive),
          auction_is_ended: 'false',
          auction_current_player_id: validCurPlayerId,
          auction_stage_status: newActive && validCurPlayerId ? 'BIDDING' : 'IDLE',
          auction_notes: auctionConfig.notes,
        }),
      ]);
      setAuctionConfig(c => ({
        ...c,
        is_active: newActive,
        is_ended: false,
        current_player_id: validCurPlayerId || null,
      }));
      showToast(`Auction session ${newActive ? 'is now LIVE!' : 'is now STOPPED / STANDBY.'}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update auction state', 'error');
    } finally {
      setSaving(false);
    }
  }

    // Set current player on the auction block
  async function setCurrentPlayer(playerId: string | null) {
    setSoldTimer(null);
    setUnsoldTimer(null);
    lastLocalActionRef.current = Date.now();
    const p = players.find(x => String(x.id) === String(playerId)) || null;

    // If player was previously passed/unsold, re-enable them in the database and local state so they are fresh for auction
    if (p && (!p.auction_eligible || p.auction_eligible === 0 || p.auction_eligible === '0')) {
      p.auction_eligible = 1;
      setPlayers(prev => prev.map(item => String(item.id) === String(playerId) ? { ...item, auction_eligible: 1 } : item));
      kplApi.updatePlayer(p.id, { auction_eligible: 1 }).catch(() => {});
    }

    // The auction session MUST remain LIVE whether putting a player on block or clearing the block!
    const willBeActive = true;

    // Optimistic instant UI update
    setAuctionConfig(c => ({
      ...c,
      current_player_id: playerId,
      is_active: willBeActive,
      is_ended: false,
    }));

    try {
      await Promise.all([
        kplApi.updateAuctionConfig({
          is_active: willBeActive,
          is_ended: false,
          status: playerId ? 'BIDDING' : 'IDLE',
          current_player_id: playerId,
          notes: auctionConfig.notes,
          player: p,
          sold_timestamp: null,
          unsold_timestamp: null,
        }),
        kplApi.saveContentSettings({
          auction_is_active: 'true',
          auction_is_ended: 'false',
          auction_current_player_id: playerId || '',
          auction_stage_status: playerId ? 'BIDDING' : 'IDLE',
          auction_notes: auctionConfig.notes,
        }),
      ]);
      lastLocalActionRef.current = Date.now();
      if (playerId && p) {
        showToast(`🏏 ${p.player_name} is now ON THE AUCTION BLOCK (Live)!`);
      } else {
        showToast('Auction block cleared.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to set player on block', 'error');
    }
  }

  // Toggle player auction eligibility
  async function toggleAuctionEligibility(p: Player) {
    const isCurrentlyEligible =
      p.auction_eligible === true ||
      p.auction_eligible === 1 ||
      p.auction_eligible === '1';

    // Optimistically update player in local state
    setPlayers(prev => prev.map(item => {
      if (String(item.id) === String(p.id)) {
        return { ...item, auction_eligible: !isCurrentlyEligible ? 1 : 0 };
      }
      return item;
    }));

    try {
      await kplApi.updatePlayer(p.id, { auction_eligible: !isCurrentlyEligible ? 1 : 0 });
      showToast(`Player ${!isCurrentlyEligible ? 'enabled' : 'disabled'} for auction.`);
      // If disabled and currently on block, clear block
      if (isCurrentlyEligible && auctionConfig.current_player_id === p.id) {
        await setCurrentPlayer(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle eligibility', 'error');
      loadData(true);
    }
  }

  // Record player sold
  async function sellPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!sellModal) return;
    setSaving(true);
    const modalPlayer = sellModal;
    const soldPrice = parseFloat(sellForm.sold_price) || Number(modalPlayer.base_price) || 0;
    const assignedTeam = teams.find(t => String(t.id) === String(sellForm.team_id));

    const updatedPlayer: Player = {
      ...modalPlayer,
      team_id: sellForm.team_id || null,
      sold_price: soldPrice,
      auction_eligible: 0,
      teams: assignedTeam || modalPlayer.teams,
    };

    // Optimistically update player in local state
    setPlayers(prev => prev.map(p => {
      if (String(p.id) === String(modalPlayer.id)) {
        return updatedPlayer;
      }
      return p;
    }));

    // Keep on the block with 60s sold countdown
    const soldTime = Date.now();
    lastLocalActionRef.current = Date.now();
    setSoldTimer({
      playerId: modalPlayer.id,
      playerName: modalPlayer.player_name,
      teamName: assignedTeam?.name || 'Franchise Team',
      soldPrice: soldPrice,
      secondsRemaining: 10,
    });

    // The player is now SOLD — clear the active bidding block immediately!
    setAuctionConfig(prev => ({
      ...prev,
      current_player_id: null,
    }));

    try {
      await Promise.all([
        kplApi.updatePlayer(modalPlayer.id, {
          team_id: sellForm.team_id || null,
          sold_price: soldPrice,
          auction_eligible: 0,
        }),
        kplApi.updateAuctionConfig({
          is_active: true,
          is_ended: false,
          status: 'CELEBRATION_SOLD',
          current_player_id: null,
          notes: auctionConfig.notes,
          sold_timestamp: soldTime,
          unsold_timestamp: null,
          player: updatedPlayer,
        }),
        // Explicitly clear auction_current_player_id from MySQL database immediately so page reloads never load a sold player!
        kplApi.saveContentSettings({
          auction_is_active: 'true',
          auction_is_ended: 'false',
          auction_current_player_id: '',
          auction_stage_status: 'IDLE',
          auction_notes: auctionConfig.notes,
        }),
      ]);

      showToast(`🎉 ${modalPlayer.player_name} sold for ₹${soldPrice.toLocaleString('en-IN')}! Showing sold screen for 10 seconds.`);
      loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to sell player', 'error');
      loadData(true);
    } finally {
      setSaving(false);
    }
  }

  // Mark player as Unsold / Pass (remove from block, mark not eligible so live screen reflects UNSOLD and clears)
  async function markAsUnsold(p: Player) {
    setSaving(true);
    setSoldTimer(null);
    lastLocalActionRef.current = Date.now();

    // Optimistically update player in local state
    // Optimistically update player in local state as unsold
    const unsoldPlayer: Player = {
      ...p,
      team_id: null,
      sold_price: null,
      auction_eligible: 0,
    };

    setPlayers(prev => prev.map(item => {
      if (String(item.id) === String(p.id)) {
        return unsoldPlayer;
      }
      return item;
    }));

    // The player is now PASSED / UNSOLD — clear the active bidding block immediately!
    setAuctionConfig(prev => ({
      ...prev,
      current_player_id: null,
    }));

    const unsoldTime = Date.now();
    lastLocalActionRef.current = Date.now();
    setUnsoldTimer({
      playerId: p.id,
      playerName: p.player_name,
      secondsRemaining: 10,
    });
    setSoldTimer(null);

    try {
      await Promise.all([
        kplApi.updatePlayer(p.id, {
          team_id: null,
          sold_price: null,
          auction_eligible: 0,
        }),
        kplApi.updateAuctionConfig({
          is_active: true,
          is_ended: false,
          status: 'CELEBRATION_UNSOLD',
          current_player_id: null,
          notes: auctionConfig.notes,
          sold_timestamp: null,
          unsold_timestamp: unsoldTime,
          player: unsoldPlayer,
        }),
        kplApi.saveContentSettings({
          auction_is_active: 'true',
          auction_is_ended: 'false',
          auction_current_player_id: '',
          auction_stage_status: 'IDLE',
          auction_notes: auctionConfig.notes,
        }),
      ]);
      lastLocalActionRef.current = Date.now();
      showToast(`📢 ${p.player_name} marked as UNSOLD & showing animated unsold celebration screen on live display for 10s.`);
      kplApi.invalidatePlayersCache();
      loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to mark as unsold', 'error');
    } finally {
      setSaving(false);
    }
  }

  // Update amount & team for already sold player
  async function updateSoldPrice(e: React.FormEvent) {
    e.preventDefault();
    if (!editPriceModal) return;
    setSaving(true);
    const targetPlayer = editPriceModal;
    const newPrice = parseFloat(editPriceForm.sold_price) || 0;
    const newTeamId = editPriceForm.team_id || targetPlayer.team_id;
    const assignedTeam = teams.find(t => String(t.id) === String(newTeamId));

    // Optimistically update player in local state
    setPlayers(prev => prev.map(p => {
      if (String(p.id) === String(targetPlayer.id)) {
        return {
          ...p,
          team_id: newTeamId,
          sold_price: newPrice,
          teams: assignedTeam || p.teams,
        };
      }
      return p;
    }));

    setEditPriceModal(null);
    setEditPriceForm({ team_id: '', sold_price: '' });

    try {
      await Promise.all([
        kplApi.updatePlayer(targetPlayer.id, {
          team_id: newTeamId,
          sold_price: newPrice,
          auction_eligible: 0,
        }),
        // Broadcast update to live in-memory store so spectator screen updates instantly
        kplApi.updateAuctionConfig({
          is_active: auctionConfig.is_active,
          current_player_id: auctionConfig.current_player_id,
          notes: auctionConfig.notes,
          player: {
            ...targetPlayer,
            team_id: newTeamId,
            sold_price: newPrice,
            teams: assignedTeam || targetPlayer.teams,
          },
        }),
      ]);

      showToast(`Updated ${targetPlayer.player_name}: ₹${newPrice.toLocaleString('en-IN')}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update sold amount', 'error');
      loadData(true);
    } finally {
      setSaving(false);
    }
  }

  // Unassign sold player and return to pool
  async function unassignPlayer(p: Player) {
    // Optimistically update local player
    setPlayers(prev => prev.map(item => {
      if (String(item.id) === String(p.id)) {
        return {
          ...item,
          team_id: null,
          sold_price: null,
          auction_eligible: 1,
          teams: null,
        };
      }
      return item;
    }));

    try {
      await Promise.all([
        kplApi.updatePlayer(p.id, { team_id: null, sold_price: null, auction_eligible: 1 }),
        kplApi.updateAuctionConfig({
          is_active: auctionConfig.is_active,
          current_player_id: auctionConfig.current_player_id === p.id ? null : auctionConfig.current_player_id,
          notes: auctionConfig.notes,
          unassign_player_id: p.id,
        }),
      ]);
      showToast(`${p.player_name} unassigned and returned to auction pool.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to unassign player', 'error');
      loadData(true);
    }
  }

  const isRetainedOrOwner = (p: Player) => {
    const roleLower = (p.role || '').toLowerCase();
    const catLower = (p.player_category || '').toLowerCase();
    if (roleLower.includes('retain') || catLower.includes('retain') || roleLower.includes('owner')) {
      return true;
    }
    // Also check if player name matches team owner
    if (p.team_id) {
      const playerTeam = teams.find(t => String(t.id) === String(p.team_id));
      const ownerName = ((playerTeam as any)?.owner_name || (playerTeam as any)?.owner || '').trim().toLowerCase();
      if (ownerName && (p.player_name || '').trim().toLowerCase() === ownerName) {
        return true;
      }
    }
    return false;
  };

  const isEligible = (p: Player) =>
    (p.auction_eligible === true || p.auction_eligible === 1 || p.auction_eligible === '1') && !p.team_id && !isRetainedOrOwner(p);

  const eligible = players.filter(p => isEligible(p));
  const sold = players.filter(p => Boolean(p.team_id) && !isRetainedOrOwner(p));
  const disabled = players.filter(p => !isEligible(p) && !p.team_id && !isRetainedOrOwner(p));
  const currentPlayer = players.find(p => String(p.id) === String(auctionConfig.current_player_id));

  // Count by parts for the eligible auction pool (Part 1: Foreigner, Part 2: Local A, Part 3: Local B)
  const poolForeignerCount = eligible.filter(p => getPlayerAuctionPart(p.player_category).key === 'foreigner').length;
  const poolLocalACount = eligible.filter(p => getPlayerAuctionPart(p.player_category).key === 'local-a').length;
  const poolLocalBCount = eligible.filter(p => getPlayerAuctionPart(p.player_category).key === 'local-b').length;

  // Filter pool by selected auction part
  const partFilteredEligible = eligible.filter(p => {
    if (selectedPart === 'all') return true;
    return getPlayerAuctionPart(p.player_category).key === selectedPart;
  });

  // Sort pool: Part 1: Foreigner -> Part 2: Local A -> Part 3: Local B, and serially by Reg ID within each part
  const sortedPartEligible = [...partFilteredEligible].sort((a, b) => {
    const partA = getPlayerAuctionPart(a.player_category).partNumber;
    const partB = getPlayerAuctionPart(b.player_category).partNumber;
    if (partA !== partB) return partA - partB;
    return compareRegistrationNumbers(a.registration_number, b.registration_number);
  });

  // Find next eligible candidate in the current sorted pool
  const nextCandidatePlayer = sortedPartEligible.find(
    p => String(p.id) !== String(auctionConfig.current_player_id) && !p.team_id
  );

  // Advance to next eligible player in the auction sequence
  const advanceToNextPlayer = useCallback(async () => {
    setSoldTimer(null);
    const candidates = sortedPartEligible.filter(
      p => String(p.id) !== String(auctionConfig.current_player_id) && !p.team_id
    );
    const nextPlayer = candidates[0] || null;

    if (nextPlayer) {
      await setCurrentPlayer(nextPlayer.id);
      showToast(`⚡ Called next player: ${nextPlayer.player_name}`);
    } else {
      showToast('No more eligible players in current filtered round.');
    }
  }, [sortedPartEligible, auctionConfig.current_player_id, players, auctionConfig.is_active]);

  // Atomic Pass & Next Player: marks current player as unsold AND directly advances block to next pool player
  const passAndNextPlayer = useCallback(async () => {
    if (!currentPlayer) return;
    setSaving(true);
    setSoldTimer(null);
    setUnsoldTimer(null);
    lastLocalActionRef.current = Date.now();

    const passingPlayerId = String(currentPlayer.id);
    const passingPlayerName = currentPlayer.player_name;

    // Find the next eligible candidate from pool (excluding the player being passed)
    const nextPlayer = sortedPartEligible.find(
      p => String(p.id) !== passingPlayerId && !p.team_id
    ) || null;

    // Optimistically update players list: mark passing player as unsold (auction_eligible: 0)
    setPlayers(prev => prev.map(item => {
      if (String(item.id) === passingPlayerId) {
        return {
          ...item,
          team_id: null,
          sold_price: null,
          auction_eligible: 0,
        };
      }
      return item;
    }));

    // Optimistically update auction config
    setAuctionConfig(prev => ({
      ...prev,
      current_player_id: nextPlayer ? nextPlayer.id : null,
      is_active: true,
      is_ended: false,
    }));

    try {
      await Promise.all([
        kplApi.updatePlayer(passingPlayerId, {
          team_id: null,
          sold_price: null,
          auction_eligible: 0,
        }),
        kplApi.updateAuctionConfig({
          is_active: true,
          is_ended: false,
          status: nextPlayer ? 'BIDDING' : 'IDLE',
          current_player_id: nextPlayer ? nextPlayer.id : null,
          player: nextPlayer || null,
          notes: auctionConfig.notes,
          sold_timestamp: null,
          unsold_timestamp: null,
        }),
        kplApi.saveContentSettings({
          auction_is_active: 'true',
          auction_is_ended: 'false',
          auction_current_player_id: nextPlayer ? String(nextPlayer.id) : '',
          auction_stage_status: nextPlayer ? 'BIDDING' : 'IDLE',
          auction_notes: auctionConfig.notes,
        }),
      ]);

      if (nextPlayer) {
        showToast(`⚡ Passed ${passingPlayerName} · Now on Block: ${nextPlayer.player_name}`);
      } else {
        showToast(`📢 ${passingPlayerName} passed. Pool round complete.`);
      }
      kplApi.invalidatePlayersCache();
    } catch (err: any) {
      showToast(err.message || 'Failed to pass player and call next', 'error');
    } finally {
      setSaving(false);
    }
  }, [currentPlayer, sortedPartEligible, auctionConfig.notes]);

  const advanceToNextPlayerRef = useRef(advanceToNextPlayer);
  advanceToNextPlayerRef.current = advanceToNextPlayer;

  // 10-second countdown interval for sold display in admin -> Auto-advances to next pool player
  useEffect(() => {
    if (!soldTimer) return;
    const interval = setInterval(() => {
      setSoldTimer(prev => {
        if (!prev) return null;
        if (prev.secondsRemaining <= 1) {
          setTimeout(() => {
            advanceToNextPlayerRef.current();
          }, 0);
          return null;
        }
        return {
          ...prev,
          secondsRemaining: prev.secondsRemaining - 1,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [soldTimer?.playerId]);

  // 10-second countdown interval for unsold celebration display in admin -> Auto-advances to next pool player
  useEffect(() => {
    if (!unsoldTimer) return;
    const interval = setInterval(() => {
      setUnsoldTimer(prev => {
        if (!prev) return null;
        if (prev.secondsRemaining <= 1) {
          setTimeout(() => {
            advanceToNextPlayerRef.current();
          }, 0);
          return null;
        }
        return {
          ...prev,
          secondsRemaining: prev.secondsRemaining - 1,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [unsoldTimer?.playerId]);

  // Search filtered subsets across all columns (Reg ID, last 3 digits, name, phone)
  const filteredEligible = sortedPartEligible.filter(p => searchMatchesPlayer(p, playerSearch));
  const filteredSold = sold.filter(p => searchMatchesPlayer(p, playerSearch));
  const filteredDisabled = disabled.filter(p => searchMatchesPlayer(p, playerSearch));

  return (
    <AdminLayout>
      <div className="admin-page admin-auction-page">
        {toast && (
          <div className={`admin-toast admin-toast-${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 24, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <Gavel size={26} color="#e8192c" /> Auction Control Center
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 14,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  background: auctionConfig.is_active ? 'rgba(34, 197, 94, 0.18)' : 'rgba(148, 163, 184, 0.15)',
                  border: auctionConfig.is_active ? '1.5px solid #22c55e' : '1px solid #64748b',
                  color: auctionConfig.is_active ? '#4ade80' : '#cbd5e1',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: auctionConfig.is_active ? '#22c55e' : '#64748b',
                    boxShadow: auctionConfig.is_active ? '0 0 8px #22c55e' : 'none',
                    display: 'inline-block',
                  }}
                />
                {auctionConfig.is_active ? 'LIVE BROADCAST ON' : 'STANDBY MODE'}
              </span>
            </div>
            <p style={{ marginTop: 4 }}>
              Fully synced with the public live auction screen. Any changes made here reflect instantly at{' '}
              <Link href="/auction" target="_blank" style={{ color: 'var(--adm-emerald)', textDecoration: 'underline' }}>
                /auction
              </Link>.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View Live Screen Button */}
            <Link
              href="/auction"
              target="_blank"
              className="admin-btn admin-btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Open public live auction screen in new tab"
            >
              <ExternalLink size={14} /> Open Live Viewer
            </Link>

            {/* Print Team Details (Select Team or All) */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--adm-border)',
              borderRadius: 6,
              padding: '2px 6px'
            }}>
              <select
                value={selectedPrintTeamId}
                onChange={e => setSelectedPrintTeamId(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: 12,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: 155,
                }}
                title="Select team to print: Team Name, Owner, Retain Player"
              >
                <option value="all" style={{ background: '#0f172a', color: '#fff' }}>
                  ★ All Franchises ({teams.length})
                </option>
                {teams.map(t => (
                  <option key={t.id} value={t.id} style={{ background: '#0f172a', color: '#fff' }}>
                    {t.name} ({t.short_code})
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={() => {
                  if (selectedPrintTeamId === 'all') {
                    printTeamDetails(teams, players);
                  } else {
                    const chosen = teams.filter(t => String(t.id) === String(selectedPrintTeamId));
                    printTeamDetails(chosen, players);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 8px',
                  fontSize: 12,
                  color: '#60a5fa',
                  fontWeight: 600
                }}
                title="Print selected team details (Team Name, Owner, Retain Player)"
              >
                <Printer size={13} /> Print Details
              </button>
            </div>

            {/* Refresh Data */}
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => loadData(false)}
              disabled={loading || saving}
              title="Force sync data from server"
            >
              <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
            </button>

            {/* Live Toggle */}
            <button
              className={`admin-btn ${auctionConfig.is_active ? 'admin-btn-danger' : 'admin-btn-primary'}`}
              onClick={toggleAuctionSession}
              disabled={saving || loading}
            >
              {saving ? (
                <Loader2 size={15} className="spin" />
              ) : auctionConfig.is_active ? (
                <Square size={15} />
              ) : (
                <Play size={15} />
              )}
              {auctionConfig.is_active ? 'Stop Auction' : 'Go Live Now'}
            </button>

            {/* divider */}
            <div style={{ width: 1, height: 28, background: '#e5e7eb', margin: '0 8px' }} />

            {/* End Auction Button */}
            <button
              onClick={() => setShowEndDialog(true)}
              disabled={!auctionConfig?.is_active || endingAuction}
              className="btn-end-auction"
              title={auctionConfig?.is_active ? 'End auction and redirect viewers' : 'Auction is already stopped'}
            >
              <Power size={14} />
              End Auction
            </button>

            {/* View Results Link (shown when auction is stopped) */}
            <a
              href="/auction/ended"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: auctionConfig?.is_active ? 'none' : 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 6,
                color: '#dca600',
                background: 'rgba(220,166,0,0.1)',
                border: '1px solid rgba(220,166,0,0.3)',
                textDecoration: 'none',
              }}
            >
              View Results ↗
            </a>
          </div>
        </div>

        {/* Standard Metric Overview Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <UserCheck size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Auction Pool</div>
              <div className="admin-stat-value">{eligible.length}</div>
              <div className="admin-stat-sub">Ready for bidding</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <Trophy size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Players Sold</div>
              <div className="admin-stat-value">{sold.length}</div>
              <div className="admin-stat-sub">Assigned to franchises</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <UserX size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Disabled / Unsold</div>
              <div className="admin-stat-value">{disabled.length}</div>
              <div className="admin-stat-sub">Pass-out or unapproved</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <DollarSign size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Total Purse Spent</div>
              <div className="admin-stat-value">
                ₹{sold.reduce((acc, p) => acc + (Number(p.sold_price) || 0), 0).toLocaleString('en-IN')}
              </div>
              <div className="admin-stat-sub">Across all {teams.length} franchise teams</div>
            </div>
          </div>
        </div>

        {/* CURRENT PLAYER ON BLOCK SPOTLIGHT */}
        <div
          style={{
            background: auctionConfig.is_active && currentPlayer
              ? 'linear-gradient(135deg, rgba(232,25,44,0.16) 0%, rgba(245,200,66,0.10) 100%)'
              : 'var(--adm-surface)',
            border: auctionConfig.is_active && currentPlayer
              ? '2px solid rgba(232,25,44,0.6)'
              : '1px solid var(--adm-border)',
            borderRadius: 14,
            padding: '24px 28px',
            marginBottom: '24px',
            boxShadow: auctionConfig.is_active && currentPlayer ? '0 8px 32px rgba(232,25,44,0.22)' : '0 4px 16px rgba(0,0,0,0.15)',
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Radio size={20} color={auctionConfig.is_active ? '#e8192c' : 'var(--adm-text-muted)'} className={auctionConfig.is_active ? 'spin' : ''} />
              <h3
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  color: auctionConfig.is_active ? '#ff4d5e' : 'var(--adm-text-muted)',
                }}
              >
                {auctionConfig.is_active ? '● Live Auction Block · Broadcasting Now' : '○ Auction Block (Standby Mode)'}
              </h3>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--adm-text-muted)' }} suppressHydrationWarning>
              {mounted && lastSyncTime ? `Auto-synced: ${lastSyncTime.toLocaleTimeString()}` : 'Connecting...'}
            </div>
          </div>

          {currentPlayer ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                {/* Large Photo Avatar */}
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#111',
                    border: '2px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={currentPlayer.photo ? getImageUrl(currentPlayer.photo) : '/images/kpl-logo.jpg'}
                    alt={currentPlayer.player_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.3px' }}>
                      {currentPlayer.player_name}
                    </strong>
                    {Boolean(currentPlayer.team_id || (soldTimer && soldTimer.playerId === currentPlayer.id)) ? (
                      <span
                        style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1.5px solid rgba(34, 197, 94, 0.6)',
                          color: '#4ade80',
                          fontSize: 12,
                          fontWeight: 900,
                          padding: '3px 10px',
                          borderRadius: 6,
                          letterSpacing: '0.8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Trophy size={13} /> SOLD
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'rgba(232,25,44,0.2)',
                          border: '1.5px solid rgba(232,25,44,0.6)',
                          color: '#ff4d5e',
                          fontSize: 11,
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: 6,
                          letterSpacing: '0.8px',
                        }}
                      >
                        LIVE ON HAMMER
                      </span>
                    )}
                    {/* Part Badge */}
                    {(() => {
                      const cPart = getPlayerAuctionPart(currentPlayer.player_category);
                      return (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: cPart.badgeBg,
                            border: `1.5px solid ${cPart.badgeBorder}`,
                            color: cPart.color,
                            fontSize: 12,
                            fontWeight: 900,
                            padding: '3px 9px',
                            borderRadius: 6,
                            letterSpacing: '0.6px',
                          }}
                        >
                          <span>{cPart.icon}</span> {cPart.badgeLabel.toUpperCase()}
                        </span>
                      );
                    })()}
                    {currentPlayer.registration_number && (
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: 12,
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: '#38bdf8',
                          padding: '2px 8px',
                          borderRadius: 6,
                        }}
                      >
                        REG: #{currentPlayer.registration_number}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: '#cbd5e1', marginTop: 4 }}>
                    <strong style={{ color: '#fff' }}>{currentPlayer.role || 'Player'}</strong>
                    {currentPlayer.age ? ` · Age ${currentPlayer.age}` : ''}
                    {currentPlayer.player_category ? ` · Category: ${currentPlayer.player_category.toUpperCase()}` : ''}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(245, 200, 66, 0.12)',
                      border: '1.5px solid rgba(245, 200, 66, 0.35)',
                      padding: '5px 12px',
                      borderRadius: 8,
                      marginTop: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#f5c842', fontWeight: 600 }}>Base Price:</span>
                    <strong style={{ fontSize: 18, color: '#f5c842', fontWeight: 900 }}>
                      ₹{Number(currentPlayer.base_price || 500).toLocaleString('en-IN')}
                    </strong>
                  </div>

                  {/* Active SOLD Celebration Banner on Block */}
                  {Boolean(currentPlayer.team_id || (soldTimer && soldTimer.playerId === currentPlayer.id)) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.14) 100%)',
                        border: '1.5px solid #10b981',
                        borderRadius: 10,
                        padding: '10px 16px',
                        marginTop: 12,
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      <Trophy size={24} color="#34d399" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: 1 }}>
                            ACQUIRED BY:
                          </span>
                          <strong style={{ fontSize: 16, color: '#ffffff', fontWeight: 900 }}>
                            {soldTimer?.teamName || currentPlayer.teams?.name || teams.find(t => String(t.id) === String(currentPlayer.team_id))?.name || 'Franchise Team'}
                          </strong>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#a7f3d0' }}>FOR</span>
                          <span style={{ fontSize: 18, color: '#f5c842', fontWeight: 900 }}>
                            ₹{Number(soldTimer?.soldPrice || currentPlayer.sold_price || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={13} color="#f5c842" />
                          <span>
                            Broadcasting celebratory sold screen on live display ·{' '}
                            {soldTimer?.secondsRemaining ? (
                              <>Auto-timer: <strong style={{ color: '#f5c842', fontSize: 13 }}>{soldTimer.secondsRemaining}s</strong></>
                            ) : (
                              <strong style={{ color: '#4ade80' }}>10s celebration complete</strong>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: '100%' }}>
                {Boolean(currentPlayer.team_id || (soldTimer && soldTimer.playerId === currentPlayer.id)) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {nextCandidatePlayer ? (
                        <button
                          className="admin-btn admin-btn-primary"
                          onClick={advanceToNextPlayer}
                          disabled={saving}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 22px',
                            fontSize: 14.5,
                            fontWeight: 800,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            border: 'none',
                            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                            cursor: 'pointer',
                          }}
                          title={`Call next player: ${nextCandidatePlayer.player_name}`}
                        >
                          <Zap size={17} /> Call Next: {nextCandidatePlayer.player_name}
                        </button>
                      ) : (
                        <span style={{ fontSize: 13, color: '#f5c842', fontWeight: 800 }}>
                          Round Complete
                        </span>
                      )}

                      <button
                        className="admin-btn admin-btn-ghost"
                        onClick={() => {
                          setSoldTimer(null);
                          setCurrentPlayer(null);
                        }}
                        disabled={saving}
                        title="Clear block and dismiss sold celebration"
                        style={{ padding: '12px 16px', fontSize: 13, borderRadius: 8 }}
                      >
                        Clear Block
                      </button>
                    </div>

                    {/* Manual Advance Note */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        color: '#94a3b8',
                        marginTop: 2,
                      }}
                    >
                      <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                      <span>Next player will be called only when you click &quot;Call Next Player&quot;.</span>
                    </div>
                  </div>
                ) : (!currentPlayer.team_id && (!currentPlayer.auction_eligible || currentPlayer.auction_eligible === 0 || currentPlayer.auction_eligible === '0')) ? (
                  /* ── ANIMATED UNSOLD BANNER & NEXT PLAYER ACTION ── */
                  <div className="admin-unsold-animated-banner" style={{ width: '100%' }}>
                    <div className="admin-unsold-badge">
                      <UserX size={15} />
                      <span>PLAYER UNSOLD · PASSED</span>
                    </div>
                    <div className="admin-unsold-title">
                      <strong>{currentPlayer.player_name}</strong> was marked as UNSOLD and moved to the pass pool.
                    </div>
                    <div style={{ fontSize: 12.5, color: '#fca5a5', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={13} color="#f87171" />
                      <span>
                        Broadcasting celebratory UNSOLD screen on live display ·{' '}
                        {unsoldTimer?.secondsRemaining ? (
                          <>Auto-timer: <strong style={{ color: '#f87171', fontSize: 13 }}>{unsoldTimer.secondsRemaining}s</strong></>
                        ) : (
                          <strong style={{ color: '#fca5a5' }}>10s unsold display complete</strong>
                        )}
                      </span>
                    </div>
                    <div className="admin-unsold-actions">
                      {nextCandidatePlayer ? (
                        <button
                          className="admin-btn"
                          onClick={advanceToNextPlayer}
                          disabled={saving}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 24px',
                            fontSize: 14.5,
                            fontWeight: 800,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            color: '#fff',
                            border: 'none',
                            boxShadow: '0 4px 18px rgba(16, 185, 129, 0.45)',
                            cursor: 'pointer',
                          }}
                        >
                          <Zap size={18} /> Call Next Player: {nextCandidatePlayer.player_name}
                        </button>
                      ) : (
                        <span style={{ fontSize: 13, color: '#f5c842', fontWeight: 800 }}>
                          No more eligible players in this round
                        </span>
                      )}

                      <button
                        className="admin-btn admin-btn-ghost"
                        onClick={() => toggleAuctionEligibility(currentPlayer)}
                        disabled={saving}
                        title="Return player to active auction pool"
                        style={{ padding: '12px 16px', fontSize: 13, borderRadius: 8 }}
                      >
                        Re-enable in Pool
                      </button>

                      <button
                        className="admin-btn admin-btn-ghost"
                        onClick={() => setCurrentPlayer(null)}
                        disabled={saving}
                        style={{ padding: '12px 16px', fontSize: 13, borderRadius: 8 }}
                      >
                        Clear Block
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      className="admin-btn admin-btn-primary"
                      onClick={() => {
                        setSellModal(currentPlayer);
                        setSellForm({ team_id: '', sold_price: String(currentPlayer.base_price || 500) });
                      }}
                      disabled={saving}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', fontSize: 14.5, fontWeight: 800, borderRadius: 8 }}
                    >
                      <Trophy size={16} /> Mark Sold (Hammer Down)
                    </button>

                    <button
                      className="admin-btn admin-btn-danger"
                      onClick={() => markAsUnsold(currentPlayer)}
                      disabled={saving}
                      title="Mark as unsold and show unsold banner"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 18px', fontSize: 13.5, fontWeight: 700, borderRadius: 8 }}
                    >
                      <UserX size={16} /> Pass / Unsold
                    </button>

                    {/* Instant Pass & Next Player in one single atomic click */}
                    <button
                      className="admin-btn"
                      onClick={passAndNextPlayer}
                      disabled={saving}
                      title="Mark player unsold and immediately call next player"
                      style={{
                        background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '12px 18px',
                        fontSize: 13.5,
                        borderRadius: 8,
                        boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                        cursor: 'pointer',
                      }}
                    >
                      <Zap size={16} /> Pass & Next Player
                    </button>

                    {nextCandidatePlayer && (
                      <button
                        className="admin-btn"
                        onClick={advanceToNextPlayer}
                        disabled={saving}
                        title={`Advance block to next player: ${nextCandidatePlayer.player_name}`}
                        style={{
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '12px 18px',
                          fontSize: 13.5,
                          borderRadius: 8,
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                          cursor: 'pointer',
                        }}
                      >
                        <Zap size={16} /> Next Player
                      </button>
                    )}

                    <button
                      className="admin-btn admin-btn-ghost"
                      onClick={() => setCurrentPlayer(null)}
                      disabled={saving}
                      title="Clear block without changing status"
                      style={{ padding: '12px 16px', fontSize: 13, borderRadius: 8 }}
                    >
                      Clear Block
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 0',
                color: 'var(--adm-text-muted)',
                fontSize: 14,
              }}
            >
              {auctionConfig.is_active ? (
                <>
                  <span style={{ fontSize: 15 }}>No player is currently on the block.</span>{' '}
                  <strong style={{ color: 'var(--adm-text-primary)', fontSize: 15, display: 'block', marginTop: 4 }}>
                    Click &ldquo;Put on Block&rdquo; on any player in the pool below to begin bidding on live screen!
                  </strong>
                </>
              ) : (
                <span style={{ fontSize: 14 }}>
                  The auction is in Standby mode. Click <strong style={{ color: '#4ade80' }}>&ldquo;Go Live Now&rdquo;</strong> in the top header to activate real-time bidding screen.
                </span>
              )}
            </div>
          )}
        </div>

        {/* AUCTION STAGE / 3-PART SELECTOR (Part 1: Foreigner, Part 2: Local A, Part 3: Local B) */}
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 'var(--adm-radius-md)',
            padding: '14px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Auction Stage:
            </span>

            {/* All Stages */}
            <button
              type="button"
              onClick={() => setSelectedPart('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: selectedPart === 'all' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.03)',
                border: selectedPart === 'all' ? '2px solid rgba(255,255,255,0.5)' : '1px solid var(--adm-border)',
                color: selectedPart === 'all' ? '#ffffff' : '#cbd5e1',
                boxShadow: selectedPart === 'all' ? '0 0 12px rgba(255,255,255,0.1)' : 'none',
              }}
            >
              <span>🌐 All Stages</span>
              <span style={{
                background: selectedPart === 'all' ? '#ffffff' : 'rgba(255,255,255,0.1)',
                color: selectedPart === 'all' ? '#0f172a' : '#94a3b8',
                fontSize: 11.5,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                {eligible.length}
              </span>
            </button>

            {/* Part 1: Foreigner */}
            <button
              type="button"
              onClick={() => setSelectedPart('foreigner')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: selectedPart === 'foreigner' ? 'rgba(56, 189, 248, 0.24)' : 'rgba(56, 189, 248, 0.05)',
                border: selectedPart === 'foreigner' ? '2px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.3)',
                color: selectedPart === 'foreigner' ? '#38bdf8' : '#7dd3fc',
                boxShadow: selectedPart === 'foreigner' ? '0 0 18px rgba(56, 189, 248, 0.4)' : 'none',
              }}
            >
              <span>✈️ Part 1: Foreigner</span>
              <span style={{
                background: selectedPart === 'foreigner' ? '#38bdf8' : 'rgba(56, 189, 248, 0.2)',
                color: selectedPart === 'foreigner' ? '#0f172a' : '#38bdf8',
                fontSize: 12,
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                {poolForeignerCount}
              </span>
            </button>

            {/* Part 2: Local A */}
            <button
              type="button"
              onClick={() => setSelectedPart('local-a')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: selectedPart === 'local-a' ? 'rgba(250, 204, 21, 0.24)' : 'rgba(250, 204, 21, 0.05)',
                border: selectedPart === 'local-a' ? '2px solid #facc15' : '1px solid rgba(250, 204, 21, 0.3)',
                color: selectedPart === 'local-a' ? '#facc15' : '#fde047',
                boxShadow: selectedPart === 'local-a' ? '0 0 18px rgba(250, 204, 21, 0.4)' : 'none',
              }}
            >
              <span>🌟 Part 2: Local A</span>
              <span style={{
                background: selectedPart === 'local-a' ? '#facc15' : 'rgba(250, 204, 21, 0.2)',
                color: selectedPart === 'local-a' ? '#0f172a' : '#facc15',
                fontSize: 12,
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                {poolLocalACount}
              </span>
            </button>

            {/* Part 3: Local B */}
            <button
              type="button"
              onClick={() => setSelectedPart('local-b')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: selectedPart === 'local-b' ? 'rgba(52, 211, 153, 0.24)' : 'rgba(52, 211, 153, 0.05)',
                border: selectedPart === 'local-b' ? '2px solid #34d399' : '1px solid rgba(52, 211, 153, 0.3)',
                color: selectedPart === 'local-b' ? '#34d399' : '#6ee7b7',
                boxShadow: selectedPart === 'local-b' ? '0 0 18px rgba(52, 211, 153, 0.4)' : 'none',
              }}
            >
              <span>⚡ Part 3: Local B</span>
              <span style={{
                background: selectedPart === 'local-b' ? '#34d399' : 'rgba(52, 211, 153, 0.2)',
                color: selectedPart === 'local-b' ? '#0f172a' : '#34d399',
                fontSize: 12,
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                {poolLocalBCount}
              </span>
            </button>
          </div>

          <div style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Current Stage:</span>
            <strong style={{ color: selectedPart === 'foreigner' ? '#38bdf8' : selectedPart === 'local-a' ? '#facc15' : selectedPart === 'local-b' ? '#34d399' : '#ffffff', fontSize: 13.5 }}>
              {selectedPart === 'all' ? 'All Pools (Full Roster)' : selectedPart === 'foreigner' ? 'Part 1: Foreigner Auction' : selectedPart === 'local-a' ? 'Part 2: Local A Auction' : 'Part 3: Local B Auction'}
            </strong>
          </div>
        </div>

        {/* Sleek Search & Filter Toolbar */}
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 'var(--adm-radius-md)',
            padding: '12px 18px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'nowrap',
            overflowX: 'auto',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              flex: '1 1 240px',
              minWidth: '220px',
              maxWidth: '400px',
              background: 'var(--adm-input-bg)',
              border: '1px solid var(--adm-border)',
              borderRadius: 'var(--adm-radius-sm)',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <Search size={16} color="var(--adm-text-muted)" />
            <input
              type="text"
              placeholder="Search by name, Reg ID (e.g. 200, KPL-PLY-200), phone..."
              value={playerSearch}
              onChange={e => setPlayerSearch(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--adm-text-primary)',
                fontSize: '13.5px',
                width: '100%',
              }}
            />
            {playerSearch && (
              <button
                type="button"
                onClick={() => setPlayerSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--adm-text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Counter */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13.5px', color: 'var(--adm-text-muted)', flexShrink: 0 }}>
            <span>
              Pool: <strong style={{ color: '#4ade80', fontSize: '15px' }}>{playerSearch ? `${filteredEligible.length}/${eligible.length}` : eligible.length}</strong>
            </span>
            <span>
              Sold: <strong style={{ color: '#38bdf8', fontSize: '15px' }}>{playerSearch ? `${filteredSold.length}/${sold.length}` : sold.length}</strong>
            </span>
            <span>
              Disabled: <strong style={{ color: '#cbd5e1', fontSize: '15px' }}>{playerSearch ? `${filteredDisabled.length}/${disabled.length}` : disabled.length}</strong>
            </span>
            <span>
              Total: <strong style={{ color: 'var(--adm-text-primary)', fontSize: '15px' }}>{players.length}</strong>
            </span>
            {playerSearch && (
              <button
                type="button"
                onClick={() => setPlayerSearch('')}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  padding: '5px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X size={12} /> Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* 3 Columns: Pool / Sold / Disabled */}
        {loading ? (
          <div className="admin-loading-rows">
            {[...Array(6)].map((_, i) => <div className="admin-skeleton-row" key={i} />)}
          </div>
        ) : (
          <div className="admin-auction-columns">
            {/* 1. Eligible pool */}
            <div className="admin-auction-col">
              <div className="admin-auction-col-header admin-auction-col-eligible" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserCheck size={18} /> Pool ({filteredEligible.length}{playerSearch ? ` of ${eligible.length}` : ''})
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, background: 'rgba(52, 211, 153, 0.15)', padding: '2px 8px', borderRadius: 4 }}>Ready for Block</span>
              </div>
              {filteredEligible.length === 0 ? (
                <div className="admin-empty-col">
                  {playerSearch ? `No pool players match "${playerSearch}".` : 'No eligible players in pool.'}
                </div>
              ) : (
                filteredEligible.map(p => {
                    const isCurrent = String(p.id) === String(auctionConfig.current_player_id);
                    const partMeta = getPlayerAuctionPart(p.player_category);
                    return (
                      <div
                        key={p.id}
                        className={`admin-auction-player-card ${isCurrent ? 'admin-auction-current' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                          {/* Player Avatar */}
                          <div
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 8,
                              overflow: 'hidden',
                              background: '#222',
                              border: '1px solid rgba(255,255,255,0.18)',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={p.photo ? getImageUrl(p.photo) : '/images/kpl-logo.jpg'}
                              alt={p.player_name}
                              loading="lazy"
                              decoding="async"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => {
                                (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                              }}
                            />
                          </div>

                          <div className="admin-auction-player-info" style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.player_name}
                              </strong>
                              <span
                                style={{
                                  background: partMeta.badgeBg,
                                  color: partMeta.color,
                                  border: `1px solid ${partMeta.badgeBorder}`,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  letterSpacing: '0.3px',
                                }}
                              >
                                {partMeta.icon} {partMeta.shortLabel}
                              </span>
                            </div>
                            <span style={{ fontSize: 12.5, color: 'var(--adm-text-secondary)', marginTop: 2 }}>
                              {p.registration_number ? <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#38bdf8', fontSize: 12 }}>#{p.registration_number} · </span> : null}
                              {p.role || '—'} {p.age ? `· Age ${p.age}` : ''}
                            </span>
                            <span className="admin-base-price" style={{ fontSize: 13.5, fontWeight: 700, color: '#f5c842', marginTop: 3 }}>
                              Base: ₹{Number(p.base_price || 500).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <div className="admin-auction-player-btns">
                          {/* Put on Block Button */}
                          <button
                            className={`dt-btn dt-btn-icon ${isCurrent ? 'admin-btn-primary' : ''}`}
                            title={isCurrent ? 'Currently live on block' : 'Broadcast on live screen block'}
                            onClick={() => setCurrentPlayer(isCurrent ? null : p.id)}
                            style={isCurrent ? { background: '#e8192c', color: '#fff', border: 'none' } : {}}
                          >
                            <Gavel size={16} />
                          </button>

                          {/* Quick Sell Modal */}
                          <button
                            className="dt-btn dt-btn-icon"
                            title="Mark sold directly"
                            onClick={() => {
                              setSellModal(p);
                              setSellForm({ team_id: '', sold_price: String(p.base_price || 500) });
                            }}
                          >
                            <Trophy size={16} />
                          </button>

                          {/* Disable / Pass */}
                          <button
                            className="dt-btn dt-btn-icon dt-btn-danger"
                            title="Disable or pass player"
                            onClick={() => toggleAuctionEligibility(p)}
                          >
                            <UserX size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* 2. Sold */}
            <div className="admin-auction-col">
              <div className="admin-auction-col-header admin-auction-col-sold" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Trophy size={18} /> Sold ({filteredSold.length}{playerSearch ? ` of ${sold.length}` : ''})
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: 4 }}>Allocated</span>
              </div>
              {filteredSold.length === 0 ? (
                <div className="admin-empty-col">
                  {playerSearch ? `No sold players match "${playerSearch}".` : 'No sold players yet.'}
                </div>
              ) : (
                filteredSold.map(p => {
                  const partMeta = getPlayerAuctionPart(p.player_category);
                  return (
                  <div key={p.id} className="admin-auction-player-card admin-auction-player-sold">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#222',
                          border: '1px solid rgba(255,255,255,0.18)',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={p.photo ? getImageUrl(p.photo) : '/images/kpl-logo.jpg'}
                          alt={p.player_name}
                          loading="lazy"
                          decoding="async"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                          }}
                        />
                      </div>
                      <div className="admin-auction-player-info" style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.player_name}
                          </strong>
                          <span
                            style={{
                              background: partMeta.badgeBg,
                              color: partMeta.color,
                              border: `1px solid ${partMeta.badgeBorder}`,
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 4,
                              letterSpacing: '0.3px',
                            }}
                          >
                            {partMeta.icon} {partMeta.shortLabel}
                          </span>
                        </div>
                        <span style={{ fontSize: 13, color: p.teams?.accent_color || '#38bdf8', fontWeight: 700, marginTop: 2 }}>
                          {p.registration_number ? <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8', fontSize: 11.5 }}>#{p.registration_number} · </span> : null}
                          {p.teams?.name || 'Assigned Franchise'}
                        </span>
                        {p.sold_price && (
                          <span className="admin-sold-price" style={{ fontSize: 14, fontWeight: 800, color: '#34d399', marginTop: 3 }}>
                            Sold: ₹{Number(p.sold_price).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="admin-auction-player-btns">
                      <button
                        className="dt-btn dt-btn-icon"
                        title="Edit sold price or franchise team"
                        onClick={() => {
                          setEditPriceModal(p);
                          setEditPriceForm({
                            team_id: p.team_id || '',
                            sold_price: String(p.sold_price || ''),
                          });
                        }}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="dt-btn dt-btn-icon dt-btn-danger"
                        title="Unassign & return to pool"
                        onClick={() => unassignPlayer(p)}
                      >
                        <UserX size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
              )}
            </div>

            {/* 3. Disabled / Unsold */}
            <div className="admin-auction-col">
              <div className="admin-auction-col-header admin-auction-col-disabled" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserX size={18} /> Disabled / Pass ({filteredDisabled.length}{playerSearch ? ` of ${disabled.length}` : ''})
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>Inactive</span>
              </div>
              {filteredDisabled.length === 0 ? (
                <div className="admin-empty-col">
                  {playerSearch ? `No disabled players match "${playerSearch}".` : 'No disabled players.'}
                </div>
              ) : (
                filteredDisabled.map(p => {
                  const partMeta = getPlayerAuctionPart(p.player_category);
                  return (
                  <div key={p.id} className="admin-auction-player-card admin-auction-player-disabled">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#222',
                          border: '1px solid rgba(255,255,255,0.18)',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={p.photo ? getImageUrl(p.photo) : '/images/kpl-logo.jpg'}
                          alt={p.player_name}
                          loading="lazy"
                          decoding="async"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                          }}
                        />
                      </div>
                      <div className="admin-auction-player-info" style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.player_name}
                          </strong>
                          <span
                            style={{
                              background: partMeta.badgeBg,
                              color: partMeta.color,
                              border: `1px solid ${partMeta.badgeBorder}`,
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 4,
                              letterSpacing: '0.3px',
                            }}
                          >
                            {partMeta.icon} {partMeta.shortLabel}
                          </span>
                        </div>
                        <span style={{ fontSize: 12.5, color: 'var(--adm-text-secondary)', marginTop: 2 }}>
                          {p.registration_number ? <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8', fontSize: 11.5 }}>#{p.registration_number} · </span> : null}
                          {p.role || '—'} {p.age ? `· Age ${p.age}` : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      className="dt-btn dt-btn-icon"
                      title="Re-enable to auction pool"
                      onClick={() => toggleAuctionEligibility(p)}
                    >
                      <UserCheck size={16} />
                    </button>
                  </div>
                );
              })
              )}
            </div>
          </div>
        )}

        {/* Sell Player Modal */}
        {sellModal && (
          <div className="admin-modal-overlay" onClick={() => setSellModal(null)}>
            <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Record Player Sale</h2>
              </div>
              <div className="admin-modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: '#111',
                      border: '2px solid rgba(255,255,255,0.2)',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={sellModal.photo ? getImageUrl(sellModal.photo) : '/images/kpl-logo.jpg'}
                      alt={sellModal.player_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                      }}
                    />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{sellModal.player_name}</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--adm-text-secondary)' }}>
                      {sellModal.registration_number ? <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#38bdf8' }}>#{sellModal.registration_number} · </span> : null}
                      {sellModal.role || 'Player'} · Base Price: <strong style={{ color: '#f5c842' }}>₹{Number(sellModal.base_price || 500).toLocaleString('en-IN')}</strong>
                    </p>
                  </div>
                </div>
              </div>
              <form className="admin-modal-form" onSubmit={sellPlayer}>
                <div className="admin-form-grid">
                  <div className="admin-form-field admin-form-full">
                    <label style={{ fontSize: 13, fontWeight: 700 }}>Winning Franchise Team *</label>
                    <select
                      required
                      value={sellForm.team_id}
                      onChange={e => setSellForm({ ...sellForm, team_id: e.target.value })}
                      style={{ fontSize: 14, padding: '10px 12px' }}
                    >
                      <option value="">Select franchise team</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.short_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-field admin-form-full">
                    <label style={{ fontSize: 13, fontWeight: 700 }}>Final Sold Price (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      required
                      value={sellForm.sold_price}
                      onChange={e => setSellForm({ ...sellForm, sold_price: e.target.value })}
                      placeholder={`Base: ₹${sellModal.base_price || 500}`}
                      style={{ fontSize: 18, fontWeight: 800, padding: '10px 14px' }}
                    />

                    {/* Quick increment buttons for accurate bidding calculations */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      {[50, 100, 200, 500, 1000].map(inc => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => {
                            const cur = parseFloat(sellForm.sold_price) || Number(sellModal.base_price) || 0;
                            setSellForm({ ...sellForm, sold_price: String(cur + inc) });
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'var(--adm-text-primary)',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          +{inc}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSellForm({ ...sellForm, sold_price: String(sellModal.base_price || 500) });
                        }}
                        style={{
                          background: 'rgba(245, 200, 66, 0.15)',
                          border: '1px solid rgba(245, 200, 66, 0.4)',
                          color: '#f5c842',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          marginLeft: 'auto',
                        }}
                      >
                        Reset to Base
                      </button>
                    </div>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setSellModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={saving} style={{ fontSize: 14, fontWeight: 800, padding: '10px 20px' }}>
                    {saving ? (
                      <>
                        <Loader2 size={15} className="spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <Trophy size={15} /> Confirm Sale & Broadcast
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Edit Sold Price Modal */}
        {editPriceModal && (
          <div className="admin-modal-overlay" onClick={() => setEditPriceModal(null)}>
            <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2><Edit3 size={18} style={{ marginRight: 6 }} /> Edit Sold Amount & Team</h2>
              </div>
              <div className="admin-modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: '#111',
                      border: '2px solid rgba(255,255,255,0.2)',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={editPriceModal.photo ? getImageUrl(editPriceModal.photo) : '/images/kpl-logo.jpg'}
                      alt={editPriceModal.player_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                      }}
                    />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editPriceModal.player_name}</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--adm-text-secondary)' }}>
                      Current: <strong style={{ color: '#4ade80' }}>₹{Number(editPriceModal.sold_price || 0).toLocaleString('en-IN')}</strong> · Base: ₹{Number(editPriceModal.base_price || 500).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
              <form className="admin-modal-form" onSubmit={updateSoldPrice}>
                <div className="admin-form-grid">
                  <div className="admin-form-field admin-form-full">
                    <label style={{ fontSize: 13, fontWeight: 700 }}>Assigned Franchise Team *</label>
                    <select
                      required
                      value={editPriceForm.team_id}
                      onChange={e => setEditPriceForm({ ...editPriceForm, team_id: e.target.value })}
                      style={{ fontSize: 14, padding: '10px 12px' }}
                    >
                      <option value="">Select franchise team</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.short_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-field admin-form-full">
                    <label style={{ fontSize: 13, fontWeight: 700 }}>Updated Sold Amount (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      required
                      value={editPriceForm.sold_price}
                      onChange={e => setEditPriceForm({ ...editPriceForm, sold_price: e.target.value })}
                      placeholder="Enter new sold price"
                      style={{ fontSize: 18, fontWeight: 800, padding: '10px 14px' }}
                    />

                    {/* Quick increment buttons for precision bidding adjustments */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      {[50, 100, 200, 500, 1000].map(inc => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => {
                            const cur = parseFloat(editPriceForm.sold_price) || 0;
                            setEditPriceForm({ ...editPriceForm, sold_price: String(cur + inc) });
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'var(--adm-text-primary)',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          +{inc}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setEditPriceForm({ ...editPriceForm, sold_price: String(editPriceModal.base_price || 500) });
                        }}
                        style={{
                          background: 'rgba(245, 200, 66, 0.15)',
                          border: '1px solid rgba(245, 200, 66, 0.4)',
                          color: '#f5c842',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          marginLeft: 'auto',
                        }}
                      >
                        Reset to Base
                      </button>
                    </div>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setEditPriceModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={saving} style={{ fontSize: 14, fontWeight: 800, padding: '10px 20px' }}>
                    {saving ? (
                      <>
                        <Loader2 size={15} className="spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} /> Save & Broadcast Change
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEndDialog && (
          <EndAuctionDialog
            onConfirm={handleEndAuction}
            onCancel={() => setShowEndDialog(false)}
            loading={endingAuction}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function EndAuctionDialog({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 8,
          padding: 24,
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: '#dc2626',
          }}
        >
          End Auction?
        </h3>
        <p
          style={{
            margin: '8px 0 0 0',
            fontSize: 14,
            color: '#6b7280',
            lineHeight: 1.5,
          }}
        >
          This will close the live auction session. All viewers will be redirected to the final results page. This cannot be undone.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              background: '#ffffff',
              border: '1px solid #d1d5db',
              color: '#374151',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 6,
              background: '#dc2626',
              border: '1px solid #dc2626',
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {loading && <Loader2 size={14} className="spin" />}
            End Auction
          </button>
        </div>
      </div>
    </div>
  );
}
