import HtmlViewerClient from './HtmlViewerClient'

export const dynamic = 'force-dynamic'

export default async function HtmlViewerPage({
    searchParams,
}: {
    searchParams: Promise<{ url?: string | string[] }>
}) {
    const sp = await searchParams
    const raw = sp?.url
    const url = Array.isArray(raw) ? raw[0] : (raw || '')
    return <HtmlViewerClient url={url} />
}
