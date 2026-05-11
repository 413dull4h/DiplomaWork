import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { SearchInput } from '../../components/common/SearchInput'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { ErrorState } from '../../components/common/ErrorState'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { TestCard } from '../../components/cards/TestCard'
import { useTests } from './useTests'
import { testCategories } from './testSchemas'

export function TestsPage() {
  const tests = useTests()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [activity, setActivity] = useState('ALL')

  const filtered = useMemo(() => {
    return (tests.data ?? []).filter((test) => {
      const matchesSearch = `${test.name} ${test.code} ${test.description ?? ''}`.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === 'ALL' || test.category === category
      const matchesActivity = activity === 'ALL' || (activity === 'ACTIVE' ? test.isActive : !test.isActive)
      return matchesSearch && matchesCategory && matchesActivity
    })
  }, [tests.data, search, category, activity])

  if (tests.isLoading) return <LoadingSkeleton />
  if (tests.error) return <ErrorState onRetry={() => void tests.refetch()} />

  return (
    <div>
      <PageHeader
        title="Test Catalog"
        subtitle="Manage diagnostic tests offered by this lab."
        actions={<Link to="/tests/new"><Button>Add new test</Button></Link>}
      />

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_180px]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search tests by name or code" />
        <Select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="ALL">All categories</option>
          {testCategories.map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}
        </Select>
        <Select value={activity} onChange={(event) => setActivity(event.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((test) => <TestCard key={test.id} test={test} />)}
        </div>
      ) : (
        <EmptyState title="No tests found" message="Adjust filters or create a new test catalog item." action={<Link to="/tests/new"><Button>Add test</Button></Link>} />
      )}
    </div>
  )
}
