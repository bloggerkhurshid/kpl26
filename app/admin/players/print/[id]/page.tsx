'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import '@/app/register/player/paper.css';

export default function PrintPlayerReceipt({ params }: { params: { id: string } }) {
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cashierName, setCashierName] = useState('Anisur Rahman');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('players').select('*').eq('id', params.id).single();
      if (!error && data) {
        setPlayer(data);
      }
      setLoading(false);
      // Give images time to load before triggering print
      setTimeout(() => {
        window.print();
      }, 500);
    }
    load();
  }, [params.id]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><Loader2 className="spin" size={32} /></div>;
  }

  if (!player) {
    return <div>Player not found.</div>;
  }

  return (
    <div className="paper-wrapper">
      <div className="paper-form">
        {/* Header */}
        <div className="paper-header">
          <div className="sl-no">Sl. No. <span className="underline" style={{ textAlign: 'center' }}>{player.registration_number?.split('-').pop() || 'N/A'}</span></div>
          <div className="header-center">
            <img src="/images/kpl-logo.jpg" alt="KPL Logo" className="kpl-logo" />
            <h1>KHORAGHAT PREMIER LEAGUE</h1>
            <div className="subtitle-badges" style={{ flexWrap: 'wrap', marginBottom: '10px' }}>
              <div style={{ width: '100%', marginBottom: '5px' }}>
                <span className="badge-green">OFFICIAL PLAYERS REGISTRATION FORM</span>
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                <span className="badge-dark">SEASON-3</span>
                <span className="badge-dark">2026</span>
              </div>
            </div>
          </div>
          <div className="header-right"></div>
        </div>

        {/* Title & Photo Section */}
        <div className="title-photo-section" style={{ justifyContent: 'center' }}>
          <div className="photo-area">
            <div className="photo-box">
              {player.photo ? <img src={player.photo} alt="Photo" /> : <div className="photo-placeholder">No Photo</div>}
            </div>
          </div>
        </div>

        <div className="section-block">
          <div className="section-title"><span>1</span> PLAYER INFORMATION</div>
          <div className="grid-2">
            <div className="input-group">
              <label>Player Name <span>*</span></label>
              <div className="input-wrapper">
                <input type="text" value={player.player_name || ''} readOnly />
              </div>
            </div>
            <div className="input-group">
              <label>Father's Name <span>*</span></label>
              <div className="input-wrapper">
                <input type="text" value={player.father_name || ''} readOnly />
              </div>
            </div>
          </div>

          <div className="grid-3">
            <div className="input-group">
              <label>Age <span>*</span></label>
              <div className="input-wrapper">
                <input type="text" value={player.age || ''} readOnly />
              </div>
            </div>
            <div className="input-group">
              <label>Contact No. <span>*</span></label>
              <div className="input-wrapper">
                <span className="icon" style={{ fontSize: '12px' }}>+91</span>
                <input type="text" value={player.contact_number || ''} readOnly />
              </div>
            </div>
            <div className="input-group">
              <label>Present Address <span>*</span></label>
              <div className="input-wrapper">
                <input type="text" value={player.present_address || ''} readOnly />
              </div>
            </div>
          </div>
        </div>

        <div className="section-block">
          <div className="section-title"><span>2</span> INFORMATION ABOUT PLAYER</div>
          <div className="info-grid">
            {/* COLUMN 1 */}
            <div className="info-box">
              <div className="input-group">
                <label>BATSMAN <span>*</span></label>
                <div className="input-wrapper" style={{ padding: 0 }}>
                  <select disabled style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: 'inherit', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }} value={player.batting_hand ? 'yes' : 'no'}>
                    <option value="yes">YES</option>
                    <option value="no">NO</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>BOWLER <span>*</span></label>
                <div className="input-wrapper" style={{ padding: 0 }}>
                  <select disabled style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: 'inherit', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }} value={player.bowler ? 'yes' : 'no'}>
                    <option value="yes">YES</option>
                    <option value="no">NO</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>ALL ROUNDER</label>
                <div className="input-wrapper" style={{ padding: 0 }}>
                  <input type="text" disabled style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: 'inherit', outline: 'none' }} value={player.all_rounder ? 'YES' : 'NO'} />
                </div>
              </div>
            </div>

            {/* COLUMN 2 */}
            <div className="info-box">
              <div className="input-group" style={{ opacity: player.batting_hand ? 1 : 0.4 }}>
                <label>BATTING HAND</label>
                <div className="input-wrapper" style={{ padding: 0 }}>
                  <select disabled style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: 'inherit', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }} value={player.batting_hand || ''}>
                    <option value="" disabled>Select...</option>
                    <option value="Right Hand">RIGHT HAND</option>
                    <option value="Left Hand">LEFT HAND</option>
                  </select>
                </div>
              </div>

              <div className="input-group" style={{ opacity: player.bowler ? 1 : 0.4 }}>
                <label>BOWLING ARM</label>
                <div className="input-wrapper" style={{ padding: 0 }}>
                  <select disabled style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: 'inherit', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }} value={player.bowling_type?.includes('Right') ? 'Right Arm' : player.bowling_type?.includes('Left') ? 'Left Arm' : ''}>
                    <option value="" disabled>Select...</option>
                    <option value="Right Arm">RIGHT ARM</option>
                    <option value="Left Arm">LEFT ARM</option>
                  </select>
                </div>
              </div>

              <div className="input-group" style={{ opacity: player.bowler ? 1 : 0.4 }}>
                <label>BOWLING STYLE</label>
                <div className="input-wrapper" style={{ padding: 0 }}>
                  <select disabled style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: 'inherit', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }} value={player.bowling_type?.includes('Pacer') ? 'Pacer' : player.bowling_type?.includes('Spinner') ? 'Spinner' : ''}>
                    <option value="" disabled>Select...</option>
                    <option value="Pacer">PACER</option>
                    <option value="Spinner">SPINNER</option>
                  </select>
                </div>
              </div>
            </div>

            {/* COLUMN 3 */}
            <div className="info-box">
              <div className="input-group">
                <label>WICKET KEEPER <span>*</span></label>
                <div className="input-wrapper" style={{ padding: 0 }}>
                  <select disabled style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: 'inherit', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }} value={player.wicket_keeper ? 'yes' : 'no'}>
                    <option value="yes">YES</option>
                    <option value="no">NO</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>PREVIOUSLY PLAYED K.P.L <span>*</span></label>
                <div className="input-wrapper" style={{ padding: 0 }}>
                  <select disabled style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: 'inherit', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }} value={player.previously_played ? 'yes' : 'no'}>
                    <option value="yes">YES</option>
                    <option value="no">NO</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>PLAYER CATEGORY <span>*</span></label>
                <div className="input-wrapper" style={{ padding: 0 }}>
                  <select disabled style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: 'inherit', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }} value={player.player_category || ''}>
                    <option value="" disabled>Select...</option>
                    <option value="Local">LOCAL</option>
                    <option value="Foreign">FOREIGN</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="section-block">
          <div className="section-title"><span>3</span> DECLARATION</div>
          <div className="declaration-box">
            <p>"I agree to participate in the Khoraghat Premier League and abide by its rules. I accept responsibility for any risks involved."</p>
            <label className="agree-checkbox">
              <input type="checkbox" checked={player.declaration_accepted} readOnly /> I agree to declaration <span>*</span>
            </label>
          </div>

          <div className="officials-info">
            <div className="official-title">Tournament Officials & Contact Information</div>
            <div className="official-grid">
              <div><span className="badge-green-outline">PRESIDENT</span> Surat Jamal Sheikh: 7002012581</div>
              <div><span className="badge-dark-outline">SECRETARY</span> Saddam Hussain: 8638479715</div>
            </div>
            <div className="official-mail">
              <div>Support Mail: khoraghatpremierleague@gmail.com</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="fb-follow" style={{ textAlign: 'right', display: 'block', lineHeight: 1.2, fontSize: '8px', color: '#64748b' }}>Scan to Follow<br/>Facebook Page</span>
                <img src="/images/fb-qr.png" alt="FB QR" style={{ width: 60, height: 60, mixBlendMode: 'multiply' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="signature-area">
          <div className="sig-box">
            {player.player_signature && <div className="sig-upload"><img src={player.player_signature} alt="Signature" /></div>}
            <div className="sig-line">Player's Signature</div>
          </div>
          <div className="sig-box">
            {player.approval && <div className="sig-upload" style={{ color: '#16a34a', fontWeight: 'bold' }}>{player.approval}</div>}
            <div className="sig-line">Signature Approval</div>
          </div>
        </div>

        {/* Cut Mark */}
        <div className="cut-mark" style={{ display: 'flex', alignItems: 'center', margin: '5px 0', color: '#64748b', fontSize: '14px' }}>
          <span>✂</span>
          <div style={{ flex: 1, borderBottom: '1px dashed #64748b', marginLeft: '10px' }}></div>
        </div>

        <div className="office-use-block">
          <div className="office-title">
            <span>OFFICE USE ONLY</span>
            <span className="office-badge">AUTHORIZED SIGNATURE & ENTRY</span>
          </div>
          <div className="office-grid">
            <div className="input-group">
              <label>Sl. No:</label>
              <input type="text" value={player.registration_number?.split('-').pop() || ''} readOnly />
            </div>
            <div className="input-group">
              <label>Reg ID:</label>
              <input type="text" value={player.registration_number || ''} readOnly />
            </div>
            <div className="input-group">
              <label>Registered By:</label>
              <input type="text" value={player.registered_by || ''} readOnly />
            </div>
            <div className="input-group">
              <label>Cashier Name / Sign:</label>
              <input type="text" value={cashierName} onChange={(e) => setCashierName(e.target.value)} placeholder="Receiver's name/sign" style={{ border: 'none', width: '100%', background: 'transparent' }} />
            </div>
            <div className="input-group">
              <label>Date:</label>
              <input type="text" value={new Date(player.created_at).toLocaleDateString()} readOnly />
            </div>
            <div className="input-group">
              <label>Player Name:</label>
              <input type="text" value={player.player_name || ''} readOnly />
            </div>
            {/* Photo on right side */}
            <div className="input-group" style={{ gridColumn: 3, gridRow: '1 / span 3', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <div className="photo-box">
                {player.photo ? (
                  <img src={player.photo} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="photo-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>PHOTO</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
