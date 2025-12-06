import { useState } from 'react'

const GRADE_DISTRIBUTIONS = [
  { value: 'normal', label: 'Normal Distribution', description: 'Bell curve: A(15%), B(30%), C(35%), D(15%), F(5%)' },
  { value: 'mostly_average', label: 'Mostly Average', description: 'More C grades: A(10%), B(25%), C(45%), D(15%), F(5%)' },
  { value: 'high_performing', label: 'High Performing', description: 'More A/B: A(35%), B(40%), C(20%), D(4%), F(1%)' },
  { value: 'struggling', label: 'Struggling Class', description: 'More D/F: A(5%), B(15%), C(30%), D(35%), F(15%)' }
]

const WRITING_LEVELS = [
  { value: 'high_school', label: 'High School', description: 'Basic academic writing (9th-12th grade)' },
  { value: 'early_undergrad', label: 'Early Undergraduate', description: 'Developing academic skills (Freshman/Sophomore)' },
  { value: 'advanced_undergrad', label: 'Advanced Undergraduate', description: 'Strong academic writing (Junior/Senior)' }
]

const VARIATION_LEVELS = [
  { value: 'low', label: 'Low', description: 'Consistent, standard style' },
  { value: 'medium', label: 'Medium', description: 'Moderate diversity in voice and approach' },
  { value: 'high', label: 'High', description: 'Significant variation in style and structure' }
]

function ConfigForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    assignment_title: '',
    assignment_description: '',
    rubric: '',
    num_students: 5,
    grade_distribution: 'normal',
    writing_level: 'early_undergrad',
    variation_level: 'medium'
  })

  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    
    if (!formData.assignment_title.trim()) {
      newErrors.assignment_title = 'Assignment title is required'
    }
    
    if (!formData.assignment_description.trim()) {
      newErrors.assignment_description = 'Assignment description is required'
    } else if (formData.assignment_description.trim().length < 20) {
      newErrors.assignment_description = 'Description must be at least 20 characters'
    }
    
    if (formData.num_students < 1 || formData.num_students > 50) {
      newErrors.num_students = 'Number of students must be between 1 and 50'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'num_students' ? parseInt(value) || 0 : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 sticky top-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Configuration</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignment Title *
          </label>
          <input
            type="text"
            name="assignment_title"
            value={formData.assignment_title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.assignment_title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Essay on Climate Change"
          />
          {errors.assignment_title && (
            <p className="mt-1 text-sm text-red-600">{errors.assignment_title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignment Description *
          </label>
          <textarea
            name="assignment_description"
            value={formData.assignment_description}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.assignment_description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe the assignment requirements, expectations, and any specific topics to cover..."
          />
          {errors.assignment_description && (
            <p className="mt-1 text-sm text-red-600">{errors.assignment_description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rubric (Optional)
          </label>
          <textarea
            name="rubric"
            value={formData.rubric}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter rubric criteria, one per line:&#10;Content Quality&#10;Organization&#10;Grammar and Mechanics"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter criteria one per line. If provided, each submission will include rubric-based scoring.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Students
          </label>
          <input
            type="number"
            name="num_students"
            value={formData.num_students}
            onChange={handleChange}
            min={1}
            max={50}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.num_students ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.num_students && (
            <p className="mt-1 text-sm text-red-600">{errors.num_students}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Between 1 and 50 students</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grade Distribution
          </label>
          <select
            name="grade_distribution"
            value={formData.grade_distribution}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {GRADE_DISTRIBUTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {GRADE_DISTRIBUTIONS.find(d => d.value === formData.grade_distribution)?.description}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Writing Level
          </label>
          <select
            name="writing_level"
            value={formData.writing_level}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {WRITING_LEVELS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {WRITING_LEVELS.find(w => w.value === formData.writing_level)?.description}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Variation Level
          </label>
          <select
            name="variation_level"
            value={formData.variation_level}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {VARIATION_LEVELS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {VARIATION_LEVELS.find(v => v.value === formData.variation_level)?.description}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Synthetic Submissions'}
        </button>
      </div>
    </form>
  )
}

export default ConfigForm
