import React, { useState, useEffect } from 'react';
import { getAnalyticsHubData } from '../../api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { handleApiError } from '../../utils/errorHandler';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsHub = ({ cycleId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAnalyticsHubData(cycleId);
        setData(result);
      } catch (err) {
        handleApiError(err, 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cycleId]);

  if (loading) {
    return (
      <div className="analytics-hub anim-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="loader-c">Loading insights...</div>
      </div>
    );
  }

  if (!data) return null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, max: 5, ticks: { stepSize: 1, color: 'var(--clr-text-muted)' }, grid: { color: 'var(--clr-border)' } },
      x: { ticks: { color: 'var(--clr-text-muted)' }, grid: { display: false } }
    }
  };

  const heatmapData = {
    labels: data.competencyHeatmap.map(c => c.name),
    datasets: [{
      label: 'Average Rating',
      data: data.competencyHeatmap.map(c => c.averageRating),
      backgroundColor: [
        'rgba(37, 99, 235, 0.8)',
        'rgba(99, 102, 241, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(249, 115, 22, 0.8)'
      ],
      borderRadius: 8,
    }]
  };

  const submissionData = {
    labels: ['Completed', 'In Progress', 'Not Started'],
    datasets: [{
      data: [data.submissionStats.completed, data.submissionStats.inProgress, data.submissionStats.notStarted],
      backgroundColor: ['#22c55e', '#3b82f6', '#94a3b8'],
      borderWidth: 0,
    }]
  };

  const growthData = {
    labels: data.growthTrends.map(g => `Cycle ${g.cycleNumber}`),
    datasets: [{
      label: 'Team Average Score',
      data: data.growthTrends.map(g => g.averageOverallScore),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: '#2563eb'
    }]
  };

  return (
    <div className="analytics-hub anim-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="card-hdr-flex" style={{ marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Analytics Command Center</h2>
          <p style={{ color: 'var(--clr-text-muted)' }}>Global Program Insights for Cycle {cycleId}</p>
        </div>
        <button className="btn btn-ghost" onClick={onBack}>← Back to Dashboard</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        
        {/* Heatmap Card */}
        <div className="card-glass" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>🔥 Team Competency Heatmap</h3>
          <div style={{ height: '300px' }}>
            <Bar data={heatmapData} options={chartOptions} />
          </div>
        </div>

        {/* Growth Trend Card */}
        <div className="card-glass" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>📈 Program Growth Velocity</h3>
          <div style={{ height: '300px' }}>
            <Line data={growthData} options={{ ...chartOptions, plugins: { legend: { display: true, position: 'bottom' } } }} />
          </div>
        </div>

        {/* Submission Compliance Card */}
        <div className="card-glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>⚡ Submission Compliance</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flex: 1 }}>
            <div style={{ width: '200px', height: '200px' }}>
              <Doughnut data={submissionData} options={{ plugins: { legend: { display: false } } }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 12, height: 12, background: '#22c55e', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.9rem' }}><strong>{data.submissionStats.completed}</strong> Completed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 12, height: 12, background: '#3b82f6', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.9rem' }}><strong>{data.submissionStats.inProgress}</strong> In Progress</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 12, height: 12, background: '#94a3b8', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.9rem' }}><strong>{data.submissionStats.notStarted}</strong> Not Started</span>
              </div>
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--clr-border)', paddingTop: '12px' }}>
                 <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>Total Candidates: <strong>{data.submissionStats.totalCandidates}</strong></p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsHub;
