import React, { useState, useEffect } from 'react';
import { Upload, Calendar, Play, Trash2, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

export default function ScriptScheduler() {
  const [activeTab, setActiveTab] = useState('upload');
  const [scripts, setScripts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedScript, setSelectedScript] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    frequencyType: 'minutes',
    frequencyValue: 5,
    startTime: '',
    endTime: '',
    runImmediately: false
  });
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchScripts();
    fetchSchedules();
  }, []);

  const fetchScripts = async () => {
    try {
      const response = await fetch(`${API_BASE}/scripts`);
      const data = await response.json();
      setScripts(data);
    } catch (error) {
      console.error('Error fetching scripts:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`${API_BASE}/schedules`);
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchLogs = async (scheduleId) => {
    try {
      const response = await fetch(`${API_BASE}/schedules/${scheduleId}/logs`);
      const data = await response.json();
      setLogs(prev => ({ ...prev, [scheduleId]: data }));
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('script', uploadFile);

    try {
      const response = await fetch(`${API_BASE}/scripts`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage('Script uploaded successfully!');
        setUploadFile(null);
        fetchScripts();
        setActiveTab('schedule');
      } else {
        setMessage(data.error || 'Upload failed');
      }
    } catch (error) {
      setMessage('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedScript) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: selectedScript,
          ...scheduleForm
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Schedule created successfully!');
        setScheduleForm({
          frequencyType: 'minutes',
          frequencyValue: 5,
          startTime: '',
          endTime: '',
          runImmediately: false
        });
        setSelectedScript('');
        fetchSchedules();
        setActiveTab('status');
      } else {
        setMessage(data.error || 'Scheduling failed');
      }
    } catch (error) {
      setMessage('Scheduling failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`${API_BASE}/schedules/${scheduleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage('Schedule deleted successfully!');
        fetchSchedules();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Delete failed');
      }
    } catch (error) {
      setMessage('Delete failed: ' + error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : 'Never';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Script Scheduler
        </h1>

        {message && (
          <div className="mb-4 p-4 bg-blue-100 border border-blue-300 rounded-lg text-blue-800">
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            {[
              { id: 'upload', label: 'Upload Script', icon: Upload },
              { id: 'schedule', label: 'Create Schedule', icon: Calendar },
              { id: 'status', label: 'View Status', icon: FileText }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === id
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Script File (.sh/.bat)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept=".sh,.bat"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-blue-600 font-medium hover:text-blue-700">
                        Choose a file
                      </span>
                      <span className="text-gray-500"> or drag and drop</span>
                    </label>
                    {uploadFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {uploadFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleFileUpload}
                  disabled={!uploadFile || loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Uploading...' : 'Upload Script'}
                </button>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Script
                  </label>
                  <select
                    value={selectedScript}
                    onChange={(e) => setSelectedScript(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a script...</option>
                    {scripts.map(script => (
                      <option key={script.id} value={script.id}>
                        {script.name} (.{script.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency Type
                    </label>
                    <select
                      value={scheduleForm.frequencyType}
                      onChange={(e) => setScheduleForm({...scheduleForm, frequencyType: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Every N {scheduleForm.frequencyType}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={scheduleForm.frequencyValue}
                      onChange={(e) => setScheduleForm({...scheduleForm, frequencyValue: parseInt(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="runImmediately"
                    checked={scheduleForm.runImmediately}
                    onChange={(e) => setScheduleForm({...scheduleForm, runImmediately: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="runImmediately" className="ml-2 text-sm text-gray-700">
                    Run immediately after scheduling
                  </label>
                </div>

                <button
                  onClick={handleScheduleSubmit}
                  disabled={!selectedScript || loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  {loading ? 'Creating Schedule...' : 'Create Schedule'}
                </button>
              </div>
            )}

            {/* Status Tab */}
            {activeTab === 'status' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Active Schedules</h3>
                
                {schedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active schedules found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map(schedule => (
                      <div key={schedule.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              {schedule.scriptName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Type: .{schedule.scriptType} | Frequency: {schedule.frequency}
                            </p>
                            <p className="text-sm text-gray-500">
                              Cron: {schedule.cronExpression}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(schedule.lastStatus)}
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete Schedule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Last Status:</span>
                            <span className={`ml-2 ${
                              schedule.lastStatus === 'success' ? 'text-green-600' :
                              schedule.lastStatus === 'failed' ? 'text-red-600' :
                              'text-gray-500'
                            }`}>
                              {schedule.lastStatus || 'Not run yet'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Last Run:</span>
                            <span className="ml-2 text-gray-600">
                              {formatDate(schedule.lastRun)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <button
                            onClick={() => fetchLogs(schedule.id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            {logs[schedule.id] ? 'Refresh Logs' : 'View Logs'}
                          </button>
                        </div>

                        {logs[schedule.id] && (
                          <div className="mt-4 bg-white rounded border">
                            <div className="px-3 py-2 bg-gray-100 border-b font-medium text-sm">
                              Recent Executions
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                              {logs[schedule.id].map((log, index) => (
                                <div key={index} className="px-3 py-2 border-b last:border-b-0 text-sm">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(log.status)}
                                      <span className="font-medium">{log.status}</span>
                                    </div>
                                    <span className="text-gray-500">
                                      {formatDate(log.started_at)}
                                    </span>
                                  </div>
                                  {log.stderr && (
                                    <div className="mt-1 p-2 bg-red-50 text-red-700 text-xs rounded">
                                      {log.stderr}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}