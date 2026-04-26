'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IncidentReport } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function ReportPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/incidents/${params.sessionId}`);
        if (res.ok) {
          const data = await res.json();
          // Map backend data to frontend IncidentReport type
          setReport({
            sessionId: data.incident.id,
            startTime: new Date(data.incident.started_at).getTime(),
            endTime: data.incident.ended_at ? new Date(data.incident.ended_at).getTime() : 0,
            reason: data.incident.metadata?.cancel_reason || 'Unknown',
            gpsTrail: data.trail.map((p: any) => ({
              lat: p.lat, lng: p.lng, accuracy: p.accuracy, recordedAt: p.recorded_at
            })),
            pointCount: data.trail.length,
            evidenceKey: data.incident.evidence_key,
            contactsNotified: data.incident.contacts_notified,
            riskScore: data.incident.risk_score
          });
        }
      } catch (e) {
        console.error('Failed to load report:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [params.sessionId]);

  const handleDownloadEvidence = async () => {
    if (!report?.evidenceKey) return;
    
    try {
      const { openDB } = await import('idb');
      const { decryptEvidence } = await import('../../lib/crypto');
      
      const db = await openDB('SafeTraceDB', 1);
      const encryptedBuffer = await db.get('evidence', report.evidenceKey);
      
      if (!encryptedBuffer) {
        alert('Evidence not found on this device. It may have been cleared or recorded on another device.');
        return;
      }
      
      const blob = await decryptEvidence(encryptedBuffer, report.sessionId);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SafeTrace_Evidence_${report.sessionId}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to decrypt evidence:', e);
      alert('Failed to decrypt evidence. Your session key might be invalid.');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-navy text-white flex items-center justify-center">Loading Report...</div>;
  }

  if (!report) {
    return <div className="min-h-screen bg-navy text-white flex flex-col items-center justify-center p-4">
      <p className="mb-4 text-gray-400">Report not found.</p>
      <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
    </div>;
  }

  return (
    <div className="min-h-screen bg-navy text-white p-4 pb-20 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-display font-bold">Incident Report</h1>
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>Done</Button>
      </div>

      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 mb-1">Started</div>
              <div>{new Date(report.startTime).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Duration</div>
              <div>{report.endTime ? Math.floor((report.endTime - report.startTime) / 1000) + 's' : 'Active'}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Max Risk Score</div>
              <div className={report.riskScore >= 0.72 ? 'text-danger font-bold' : ''}>
                {Math.round(report.riskScore * 100)}%
              </div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Resolution</div>
              <div className="capitalize">{report.reason}</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Tracking Data</h2>
          <div className="flex justify-between items-center mb-4 text-sm">
            <span>Location Points Recorded</span>
            <span className="font-mono bg-white/10 px-2 py-1 rounded">{report.pointCount}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Contacts Notified</span>
            <span className="font-mono bg-white/10 px-2 py-1 rounded text-safe">{report.contactsNotified}</span>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Evidence</h2>
          {report.evidenceKey ? (
            <div className="space-y-4">
              <div className="text-sm flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="mt-0.5 text-safe">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Encrypted Audio Secured</p>
                  <p className="text-xs text-gray-400 mt-1">Stored securely on your device using AES-256 encryption.</p>
                </div>
              </div>
              <Button onClick={handleDownloadEvidence} className="w-full bg-white text-navy hover:bg-gray-200 font-semibold">
                Decrypt & Download Audio
              </Button>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">No audio evidence recorded for this incident.</div>
          )}
        </Card>

        <div className="pt-4 space-y-3">
          <Button variant="outline" className="w-full">Generate FIR PDF</Button>
          <Button variant="ghost" className="w-full text-gray-400">Share Report</Button>
        </div>
      </div>
    </div>
  );
}
