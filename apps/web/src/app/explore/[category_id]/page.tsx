import ExploreList from '@/components/explore-list'
import RootWrapper from '@/components/root-wrapper'

interface IProps {
  params: {
    category_id: string
  }
}

export default async function Page({ params }: IProps) {
  const { category_id } = params

  return (
    <RootWrapper pageTitle={`Explore: ${category_id}`} nav={<ExploreList />}>
      <div className="p-2">TODO: explore {category_id}</div>
    </RootWrapper>
  )
}
