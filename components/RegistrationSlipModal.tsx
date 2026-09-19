'use client';

import React, { useRef, useState } from 'react';
import { X, Download, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import { getImageUrl } from '@/lib/api';

interface PlayerDetails {
  id?: string;
  registration_number?: string;
  player_name?: string;
  father_name?: string;
  age?: number | string;
  age_input?: string;
  contact_number?: string;
  present_address?: string;
  photo?: string;
  batting_hand?: string;
  bowling_style?: string;
  bowling_type?: string;
  wicket_keeper?: boolean | string | number;
  batsman?: boolean | string | number;
  bowler?: boolean | string | number;
  all_rounder?: boolean | string | number;
  role?: string;
  player_category?: string;
  previously_played?: boolean | string | number;
  registered_by?: string;
  serial_no?: string;
}

interface RegistrationSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerDetails | null;
}

export function RegistrationSlipModal({ isOpen, onClose, player }: RegistrationSlipModalProps) {
  const slipRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !player) return null;

  const handleDownloadImage = async () => {
    if (!slipRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `KPL_Registration_${player.registration_number || player.player_name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading slip', err);
      alert('Failed to download image. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isWkStr = String(player.wicket_keeper).toLowerCase();
  const isWk = isWkStr === 'true' || isWkStr === '1' || isWkStr === 'yes';
  
  const isPlayedStr = String(player.previously_played).toLowerCase();
  const isPlayed = isPlayedStr === 'true' || isPlayedStr === '1' || isPlayedStr === 'yes';
  
  const isAllRounderStr = String(player.all_rounder).toLowerCase();
  const isAllRounder = isAllRounderStr === 'true' || isAllRounderStr === '1' || isAllRounderStr === 'yes';
  
  const isBowlerStr = String(player.bowler).toLowerCase();
  const isBowler = isBowlerStr === 'true' || isBowlerStr === '1' || isBowlerStr === 'yes';
  
  const isBatsmanStr = String(player.batsman).toLowerCase();
  const isBatsman = isBatsmanStr === 'true' || isBatsmanStr === '1' || isBatsmanStr === 'yes';

  const actualBowlingStyle = player.bowling_style || player.bowling_type;

  let calculatedRole = 'Player';
  if (isAllRounder || (player.batting_hand && actualBowlingStyle && actualBowlingStyle !== 'None' && actualBowlingStyle !== 'N/A')) {
    calculatedRole = 'All-Rounder';
  } else if (isWk) {
    calculatedRole = 'Wicket-Keeper Batsman';
  } else if (isBowler || (actualBowlingStyle && actualBowlingStyle !== 'None' && actualBowlingStyle !== 'N/A')) {
    calculatedRole = 'Bowler';
  } else if (isBatsman || player.batting_hand) {
    calculatedRole = 'Batsman';
  } else if (player.role) {
    calculatedRole = player.role;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl relative my-auto border border-gray-200 print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Modal Header */}
        <div className="bg-green-700 text-white p-4 rounded-t-xl flex justify-between items-start print:hidden">
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">Registration Slip</h2>
              <p className="text-green-100 text-sm">Khoraghat Premier League • Season-3 (2026)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-green-600 rounded transition-colors text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 print:p-0 text-gray-800">
          
          {/* Slip Container for Image capture */}
          <div ref={slipRef} className="border border-gray-200 rounded-lg bg-white relative overflow-hidden print:border-none">
            
            {/* Header of slip */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2 text-gray-600 font-bold text-sm uppercase tracking-wider">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                REGISTRATION SLIP
              </div>
              <div className="bg-green-700 text-white px-3 py-1 rounded text-sm font-bold tracking-wider">
                {player.registration_number || `KPL-${player.id || 'N/A'}`}
              </div>
            </div>

            {/* Slip Content */}
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
              
              {/* Photo Area */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-32 h-40 bg-gray-100 border border-gray-300 rounded overflow-hidden shadow-sm">
                  {player.photo ? (
                    <img 
                      src={getImageUrl(player.photo)} 
                      alt={player.player_name} 
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">
                      No Photo
                    </div>
                  )}
                </div>
              </div>

              {/* Details List */}
              <div className="flex-grow flex flex-col gap-y-3 text-sm sm:text-base pb-4">
                
                <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                  <span className="text-gray-500">Serial No.:</span>
                  <span className="font-bold break-all">{player.serial_no || player.registration_number?.split('-').pop() || 'N/A'}</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                  <span className="text-gray-500">Player Name:</span>
                  <span className="font-bold break-words">{player.player_name || 'N/A'}</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                  <span className="text-gray-500">Father's Name:</span>
                  <span className="font-bold break-words">{player.father_name || 'N/A'}</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                  <span className="text-gray-500">Age / Year of Birth:</span>
                  <span className="font-bold break-words">{player.age || player.age_input || 'N/A'}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                  <span className="text-gray-500">Contact Number:</span>
                  <span className="font-bold break-words">{player.contact_number || 'N/A'}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                  <span className="text-gray-500">Present Address:</span>
                  <span className="font-medium break-words">{player.present_address || 'N/A'}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                  <span className="text-gray-500">Batting Style:</span>
                  <div>
                    {player.batting_hand ? (
                      <div className="w-max px-2.5 py-1 rounded border bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">{player.batting_hand}</div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                </div>

                {actualBowlingStyle && (
                  <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                    <span className="text-gray-500">Bowling Style:</span>
                    <div>
                      <div className="w-max px-2.5 py-1 rounded border bg-green-50 text-green-700 border-green-200 text-xs font-semibold">{actualBowlingStyle}</div>
                    </div>
                  </div>
                )}

                {isWk && (
                  <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                    <span className="text-gray-500">Wicket Keeper:</span>
                    <div>
                      <div className="w-max px-2.5 py-1 rounded border bg-gray-200 text-gray-800 border-gray-300 text-xs font-semibold">Yes</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                  <span className="text-gray-500">Player Category:</span>
                  <div>
                    {player.player_category ? (
                      <div className="w-max px-2.5 py-1 rounded border bg-cyan-50 text-cyan-700 border-cyan-200 text-xs font-semibold">{player.player_category}</div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                  <span className="text-gray-500">Player Role:</span>
                  <div>
                    <div className="w-max px-2.5 py-1 rounded border bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold">
                      {calculatedRole}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                  <span className="text-gray-500">Previously Played:</span>
                  <div>
                    {isPlayed ? (
                      <div className="w-max px-2.5 py-1 rounded border bg-yellow-50 text-yellow-700 border-yellow-200 text-xs font-semibold">Yes</div>
                    ) : (
                      <div className="w-max px-2.5 py-1 rounded border bg-gray-100 text-gray-500 border-gray-200 text-xs">No</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                  <span className="text-gray-500">Registered By:</span>
                  <span className="font-bold break-words">{player.registered_by === 'admin' ? 'Admin' : (player.registered_by || 'Self')}</span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-xl flex justify-between items-center print:hidden">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded shadow-sm transition-colors text-sm"
          >
            Close
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium rounded shadow-sm flex items-center gap-2 transition-colors text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded shadow-sm flex items-center gap-2 transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Saving...' : 'Download Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
