// ═══════════════════════════════════════════════════════
//  SHARING UTILITIES
// ═══════════════════════════════════════════════════════

import type { Match, Innings } from '../types/cricket';
import { getOversString, getTotalExtras, getExtrasBreakdown } from './scoring';
import html2canvas from 'html2canvas';

function formatInningsLine(teamName: string, inn: Innings): string {
  return `${teamName}: ${inn.runs}/${inn.wickets} (${getOversString(inn.deliveries)})`;
}

/** Build WhatsApp-friendly share text with bold markers */
export function buildShareText(m: Match): string {
  const [i1, i2] = m.innings;
  let txt = `🏏 *Backyard Cricket*\n`;
  txt += `${m.teams[0]} vs ${m.teams[1]}`;
  if (m.venue) txt += ` · ${m.venue}`;
  txt += ` · ${m.settings.overs} overs\n`;
  txt += `\n${formatInningsLine(m.teams[0], i1)}`;
  if (i2.deliveries.length > 0) {
    txt += `\n${formatInningsLine(m.teams[1], i2)}`;
  }
  if (m.winner) {
    txt += `\n\n🏆 *${m.winner === 'Match tied' ? 'Match Tied' : m.winner + ' won ' + m.margin}*`;
  }
  txt += `\n\n📱 Scored with Backyard Cricket Scorer`;
  return txt;
}

/** Build detailed scorecard text */
export function buildDetailedShareText(m: Match): string {
  let txt = buildShareText(m);

  m.innings.forEach((inn, idx) => {
    if (inn.deliveries.length === 0) return;
    txt += `\n\n--- ${m.teams[idx]} ---`;
    const batters = Object.entries(inn.batters);
    if (batters.length > 0) {
      batters.forEach(([name, b]) => {
        const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : '0';
        const out = b.howOut || 'not out';
        txt += `\n${name}: ${b.runs}(${b.balls}) SR:${sr} [${out}]`;
      });
    }
    txt += `\nExtras: ${getTotalExtras(inn)} (${getExtrasBreakdown(inn)})`;
  });

  return txt;
}

/** Share via WhatsApp */
export function shareViaWhatsApp(m: Match): void {
  const text = buildShareText(m);
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const url = isMobile
    ? `whatsapp://send?text=${encodeURIComponent(text)}`
    : `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

/** Share via clipboard */
export async function shareViaClipboard(m: Match): Promise<boolean> {
  const text = buildDetailedShareText(m);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Share via Web Share API */
export async function shareViaWebShare(m: Match): Promise<boolean> {
  const text = buildShareText(m);
  if (navigator.share) {
    try {
      await navigator.share({ text, title: 'Cricket Score' });
      return true;
    } catch {
      return false;
    }
  }
  return shareViaClipboard(m);
}

/** Capture screenshot */
export async function captureScreenshot(elementId: string, m: Match): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }
  
  try {
    const canvas = await html2canvas(element, { 
      backgroundColor: '#0a0a0a',
      scale: 2, // Better resolution
      useCORS: true 
    });
    const dataUrl = canvas.toDataURL('image/png');
    
    // Check if Web Share API supports files
    if (navigator.share) {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `${m.teams[0]}_vs_${m.teams[1]}_scorecard.png`, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Cricket Scorecard',
            text: buildShareText(m)
          });
          return;
        }
      } catch (err) {
        console.warn('Web Share API failed or unsupported, falling back to download', err);
      }
    }
    
    // Fallback: Download image
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${m.teams[0]}_vs_${m.teams[1]}_scorecard.png`;
    a.click();
  } catch (err) {
    console.error('Failed to capture screenshot', err);
    alert('Failed to generate scorecard image.');
  }
}

/** Export matches as JSON file download */
export function exportAsJSON(matches: Match[]): void {
  const data = JSON.stringify(matches, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cricket-history-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export matches as CSV file download */
export function exportAsCSV(matches: Match[]): void {
  const headers = ['Date', 'Team 1', 'Team 2', 'Score 1', 'Score 2', 'Winner', 'Margin', 'Overs', 'Venue'];
  const rows = matches.map(m => [
    m.date,
    m.teams[0],
    m.teams[1],
    `${m.innings[0].runs}/${m.innings[0].wickets}`,
    `${m.innings[1].runs}/${m.innings[1].wickets}`,
    m.winner,
    m.margin,
    String(m.settings.overs),
    m.venue || '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cricket-history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Import matches from JSON file */
export async function importFromJSON(file: File): Promise<Match[]> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('Invalid format: expected an array of matches');
  return data as Match[];
}
