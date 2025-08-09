export async function downloadPDF(assessmentId: string, tier: 'free' | 'enhanced' | 'monograph') {
  try {
    console.log(`Downloading ${tier} PDF for assessment ${assessmentId}`)
    
    const response = await fetch('/api/download-guide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessmentId,
        tier
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('PDF download failed:', response.status, errorText)
      throw new Error(`Failed to download PDF (${response.status})`)
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${assessmentId}-${tier}-guide.pdf`
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    }, 100)
    
    return true
  } catch (error) {
    console.error('PDF download error:', error)
    alert(`Failed to download PDF. Please try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}