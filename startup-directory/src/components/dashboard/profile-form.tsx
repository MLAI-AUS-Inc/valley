"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/ui/file-upload"
import { profileSchema, stageOptions, type ProfileFormData } from "@/lib/validations"
import { Startup } from "@/lib/types/database"
import { uploadFile, deleteFile } from "@/lib/utils/upload"
import { cardStyle } from "@/lib/utils"
import { X } from "lucide-react"

interface ProfileFormProps {
  startup: Startup
}

export function ProfileForm({ startup }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: startup.name,
    slug: startup.slug,
    logo_url: startup.logo_url || "",
    tagline: startup.tagline || "",
    description_md: startup.description_md || "",
    website_url: startup.website_url || "",
    location: startup.location || "Melbourne, Australia",
    sectors: startup.sectors || [],
    stage: startup.stage,
    email: startup.email || "",
    twitter_url: startup.twitter_url || "",
    linkedin_url: startup.linkedin_url || "",
  })
  const [newSector, setNewSector] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true)
    setError(null)
    
    try {
      const logoUrl = await uploadFile(file)
      setFormData(prev => ({ ...prev, logo_url: logoUrl }))
      
      // Auto-save the profile with the new logo
      const updatedFormData = { ...formData, logo_url: logoUrl }
      const validatedData = profileSchema.parse(updatedFormData)
      
      const { error } = await supabase
        .from('startups')
        .update(validatedData)
        .eq('id', startup.id)

      if (error) {
        setError(`Failed to save logo: ${error.message}`)
      } else {
        setSuccess(true)
        router.refresh()
      }
    } catch (err: any) {
      // Provide more specific error messages
      if (err.message?.includes('Storage bucket not found')) {
        setError('Storage not configured. Please set up storage buckets in your Supabase project.')
      } else if (err.message?.includes('network')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(err.message || 'Failed to upload logo. Please try again.')
      }
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleLogoRemove = async () => {
    if (formData.logo_url && formData.logo_url !== startup.logo_url) {
      try {
        await deleteFile(formData.logo_url)
      } catch (err) {
        console.error('Failed to delete old logo:', err)
      }
    }
    setFormData(prev => ({ ...prev, logo_url: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const validatedData = profileSchema.parse(formData)
      
      const { error } = await supabase
        .from('startups')
        .update(validatedData)
        .eq('id', startup.id)

      if (error) {
        setError(error.message || 'Failed to update profile')
      } else {
        setSuccess(true)
        router.refresh()
      }
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].message)
      } else if (err.message) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred. Please check your input and try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const addSector = () => {
    if (newSector.trim() && !formData.sectors?.includes(newSector.trim())) {
      setFormData(prev => ({
        ...prev,
        sectors: [...(prev.sectors || []), newSector.trim()]
      }))
      setNewSector("")
    }
  }

  const removeSector = (sectorToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      sectors: prev.sectors?.filter(sector => sector !== sectorToRemove) || []
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card style={cardStyle}>
        <CardHeader>
          <CardTitle>Startup Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 text-sm text-green-500 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                Profile updated successfully!
              </div>
            )}

            <div className="max-w-md">
              <FileUpload
                value={formData.logo_url}
                onChange={(url) => setFormData(prev => ({ ...prev, logo_url: url || "" }))}
                onFileSelect={handleLogoUpload}
                disabled={loading || uploadingLogo}
                label="Startup Logo"
                maxSize={5}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="mt-4 block">Startup Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="mt-4 block">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                  disabled={loading}
                  placeholder="your-startup-name"
                />
                <p className="text-xs text-muted-foreground">
                  Your public profile will be at: /s/{formData.slug}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tagline" className="mt-4 block">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  disabled={loading}
                  placeholder="A brief description of what you do"
                  maxLength={120}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage" className="mt-4 block">Stage</Label>
                <div className="relative">
                  <select
                    id="stage"
                    value={formData.stage}
                    onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value as any }))}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm appearance-none pr-8"
                    style={{
                      backgroundColor: 'rgba(40, 40, 40, 0.9)',
                      border: '1px solid #404040',
                      color: 'white'
                    }}
                  >
                    {stageOptions.map((stage) => (
                      <option key={stage} value={stage} style={{ backgroundColor: 'rgba(40, 40, 40, 0.9)', color: 'white' }}>
                        {stage.replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="mt-4 block">About</Label>
              <Textarea
                id="description"
                value={formData.description_md}
                onChange={(e) => setFormData(prev => ({ ...prev, description_md: e.target.value }))}
                disabled={loading}
                placeholder="Tell people about your startup..."
                rows={4}
                maxLength={2000}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="website" className="mt-4 block">Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                  disabled={loading}
                  placeholder="https://your-website.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="mt-4 block">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  disabled={loading}
                  placeholder="Melbourne, Australia"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="mt-4 block">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={loading}
                  placeholder="hello@yourstartup.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="mt-4 block">X (Twitter) URL</Label>
                <Input
                  id="twitter"
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, twitter_url: e.target.value }))}
                  disabled={loading}
                  placeholder="https://x.com/yourstartup"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="mt-4 block">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  disabled={loading}
                  placeholder="https://linkedin.com/company/yourstartup"
                />
              </div>

              <div className="space-y-2">
                <Label className="mt-4 block">Sectors</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    disabled={loading}
                    placeholder="Add a sector (e.g., fintech, AI)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSector())}
                  />
                  <Button type="button" onClick={addSector} disabled={loading} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.sectors && formData.sectors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.sectors.map((sector) => (
                      <Badge 
                        key={sector} 
                        className="flex items-center gap-1 text-gray-800"
                        style={{ 
                          backgroundColor: '#F5F5DC',
                          border: '1px solid #E5E5D0'
                        }}
                      >
                        {sector}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeSector(sector)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <Button 
                type="submit" 
                disabled={loading} 
                size="sm"
                style={{
                  backgroundColor: '#0F8A8A',
                  borderColor: '#0F8A8A',
                  color: 'white'
                }}
                className="hover:bg-teal-700 hover:border-teal-700"
              >
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 