'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandSettingsForm } from '@/components/settings/brand-settings-form';
import { Palette, User, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col h-full gap-4 p-1 w-full bg-dot">
      <div className="flex bg-background/50 dark:bg-background/80 flex-1 flex-col gap-4 p-4 border border-border">
        <div className=''>
          <h1 className="text-xl">Settings</h1>
          <p className="text-muted-foreground text-xs">
            Manage your workspace preferences and brand identity
          </p>
        </div>

        <Tabs defaultValue="brand" className="space-y-6">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="brand" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Brand</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Brand Settings Tab */}
          <TabsContent value="brand" className='p-0'>
          <BrandSettingsForm />
          
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Profile settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you receive updates and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Notification settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Security settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
