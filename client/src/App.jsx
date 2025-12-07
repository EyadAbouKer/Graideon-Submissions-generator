import { useState, useMemo, useEffect } from 'react'
import ConfigForm from './components/ConfigForm'
import SubmissionsTable from './components/SubmissionsTable'
import SubmissionModal from './components/SubmissionModal'
import ExportButtons from './components/ExportButtons'
import LoginPage from './components/LoginPage'
import PastGenerations from './components/PastGenerations'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [authChecking, setAuthChecking] = useState(true)
  const [activeTab, setActiveTab] = useState('generate')
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.authenticated) {
        setIsAuthenticated(true)
        setUserEmail(data.email)
      }
    } catch (err) {
      console.error('Auth check failed:', err)
    } finally {
      setAuthChecking(false)
    }
  }

  const handleLogin = (email) => {
    setIsAuthenticated(true)
    setUserEmail(email)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (err) {
      console.error('Logout error:', err)
    }
    setIsAuthenticated(false)
    setUserEmail('')
    setSubmissions([])
  }

  const handleGenerate = async (formData) => {
    setLoading(true)
    setError(null)
    setSubmissions([])
    setAssignmentTitle(formData.assignment_title)
    
    try {
      const response = await fetch('/api/generate_submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate submissions')
      }
      
      const data = await response.json()
      setSubmissions(data.submissions)
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

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Synthetic Student Submission Generator
            </h1>
            <p className="text-gray-600 mt-1">
              Generate realistic student submissions using AI for testing and training
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('generate')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'past'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Past Generations
            </button>
          </nav>
        </div>

        {activeTab === 'generate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ConfigForm onSubmit={handleGenerate} loading={loading} />
            </div>

            <div className="lg:col-span-2">
            {loading && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Generating student submissions...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a minute depending on the number of students</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {!loading && submissions.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Generated Submissions ({filteredAndSortedSubmissions.length})
                      </h2>
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
                        assignmentTitle={assignmentTitle} 
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
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure your assignment and click "Generate" to create synthetic student submissions
                </p>
              </div>
            )}
          </div>
        </div>
        ) : (
          <PastGenerations onSelectSubmission={setSelectedSubmission} />
        )}
      </main>

      {selectedSubmission && (
        <SubmissionModal
          submission={selectedSubmission}
          assignmentTitle={assignmentTitle}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  )
}

export default App
