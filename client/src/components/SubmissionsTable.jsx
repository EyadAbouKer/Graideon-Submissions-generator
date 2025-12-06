function SubmissionsTable({ submissions, onSelectSubmission, sortField, sortDirection, onSort }) {
  const getGradeColor = (grade) => {
    const colors = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800'
    }
    return colors[grade] || 'bg-gray-100 text-gray-800'
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const SortableHeader = ({ field, children }) => (
    <th
      onClick={() => onSort(field)}
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIcon field={field} />
      </div>
    </th>
  )

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <SortableHeader field="id">ID</SortableHeader>
            <SortableHeader field="student_name">Name</SortableHeader>
            <SortableHeader field="grade">Grade</SortableHeader>
            <SortableHeader field="total_score">Score</SortableHeader>
            <SortableHeader field="word_count">Words</SortableHeader>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Preview
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {submissions.map((submission) => (
            <tr 
              key={submission.id} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelectSubmission(submission)}
            >
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {submission.id}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {submission.student_name}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(submission.grade)}`}>
                  {submission.grade}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {submission.total_score}/100
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {submission.word_count}
              </td>
              <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                {submission.submission_text.substring(0, 80)}...
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectSubmission(submission)
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SubmissionsTable
