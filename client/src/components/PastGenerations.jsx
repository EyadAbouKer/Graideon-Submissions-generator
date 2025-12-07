import { useState, useEffect, useMemo } from 'react'
import SubmissionsTable from './SubmissionsTable'
import ExportButtons from './ExportButtons'
import SubmissionModal from './SubmissionModal'

function PastGenerations({ onSelectSubmission }) {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      fetchSessionDetails(selectedSession.id)
    } else {
      setSubmissions([])
    }
  }, [selectedSession])

  const fetchSessions = async () => {
    setLoadingSessions(true)
    setError(null)
    try {
      const response = await fetch('/api/sessions', {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      const data = await response.json()
      setSessions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingSessions(false)
    }
  }

  const fetchSessionDetails = async (sessionId) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch session details')
      }
      const data = await response.json()
      setSubmissions(data.submissions || [])
      setCurrentPage(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = submissions.filter(sub => {
      const term = searchTerm.toLowerCase()
      return (
        sub.student_name.toLowerCase().includes(term) ||
        sub.id.toLowerCase().includes(term) ||
        sub.grade.toLowerCase().includes(term) ||
        sub.submission_text.toLowerCase().includes(term)
      )
    })

    filtered.sort((a, b) => {
      let aVal, bVal
      
      if (sortField === 'total_score' || sortField === 'word_count') {
        aVal = a[sortField]
        bVal = b[sortField]
      } else if (sortField === 'grade') {
        const gradeOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'F': 5 }
        aVal = gradeOrder[a.grade] || 6
        bVal = gradeOrder[b.grade] || 6
      } else {
        aVal = a[sortField]?.toString().toLowerCase() || ''
        bVal = b[sortField]?.toString().toLowerCase() || ''
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [submissions, searchTerm, sortField, sortDirection])

  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedSubmissions.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedSubmissions, currentPage])

  const totalPages = Math.ceil(filteredAndSortedSubmissions.length / itemsPerPage)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loadingSessions) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Loading past generations...</p>
      </div>
    )
  }

  if (error && !selectedSession) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchSessions}
          className="mt-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (selectedSession) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => {
                  setSelectedSession(null)
                  setSubmissions([])
                  setSearchTerm('')
                }}
                className="text-blue-600 hover:text-blue-800 font-medium mb-2 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Past Generations
              </button>
              <h2 className="text-xl font-semibold text-gray-900">{selectedSession.assignment_title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Generated on {formatDate(selectedSession.created_at)} • {selectedSession.num_students} students
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading submissions...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!loading && submissions.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Submissions ({filteredAndSortedSubmissions.length})
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <ExportButtons 
                    submissions={submissions} 
                    assignmentTitle={selectedSession.assignment_title} 
                  />
                </div>
              </div>
            </div>

            <SubmissionsTable
              submissions={paginatedSubmissions}
              onSelectSubmission={setSelectedSubmission}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />

            {totalPages > 1 && (
              <div className="p-4 border-t flex justify-between items-center">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && submissions.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No submissions found for this session.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Past Generations</h2>
        <p className="text-sm text-gray-600 mt-1">View and manage previously generated submission sets</p>
      </div>

      {sessions.length === 0 ? (
        <div className="p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No past generations</h3>
          <p className="mt-1 text-sm text-gray-500">
            Generate your first set of submissions to see them here
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-medium text-gray-900">{session.assignment_title}</h3>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <span>{session.num_students} students</span>
                    <span>•</span>
                    <span>{formatDate(session.created_at)}</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSubmission && selectedSession && (
        <SubmissionModal
          submission={selectedSubmission}
          assignmentTitle={selectedSession.assignment_title}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  )
}

export default PastGenerations

