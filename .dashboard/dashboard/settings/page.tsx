import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DeleteAccountSection } from "@/components/dashboard/delete-account";
import { DashboardHeader } from "@/components/dashboard/header";
import { UserNameForm } from "@/components/forms/user-name-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

export const metadata = constructMetadata({
  title: "Settings – ExpertOS",
  description: "Configure your expert profile and account settings.",
});

// Expert Profile Form Component
function ExpertProfileForm() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Expert Profile</CardTitle>
        <CardDescription>
          Information used in official court documents and reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Expert License */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">Expert License Number</Label>
            <Input
              id="licenseNumber"
              placeholder="e.g., EXP-2024-001234"
              defaultValue="EXP-2024-001234"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseExpiry">License Expiry Date</Label>
            <Input
              id="licenseExpiry"
              type="date"
              defaultValue="2025-12-31"
            />
          </div>
        </div>

        {/* Specialty */}
        <div className="space-y-2">
          <Label htmlFor="specialty">Specialization</Label>
          <select
            id="specialty"
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
            defaultValue="labor"
          >
            <option value="labor">Labor & Employment Law</option>
            <option value="commercial">Commercial Disputes</option>
            <option value="real-estate">Real Estate</option>
            <option value="family">Family Law</option>
            <option value="construction">Construction</option>
          </select>
        </div>

        {/* Contact for Official Documents */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-4">
          <h4 className="font-medium">Official Contact Information</h4>
          <p className="text-sm text-muted-foreground">
            This information appears on court submissions and reports
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="officePhone">Office Phone</Label>
              <Input
                id="officePhone"
                type="tel"
                placeholder="+968 XXXX XXXX"
                defaultValue="+968 2456 7890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="officeFax">Fax Number</Label>
              <Input
                id="officeFax"
                type="tel"
                placeholder="+968 XXXX XXXX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="officeAddress">Office Address</Label>
            <textarea
              id="officeAddress"
              className="w-full p-3 rounded-md border border-input bg-background resize-none"
              rows={2}
              placeholder="Full office address..."
              defaultValue="Building 42, Al Khuwair Business Center, Muscat, Sultanate of Oman"
            />
          </div>
        </div>

        {/* Bank Details */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-4">
          <h4 className="font-medium">Bank Details for Invoices</h4>
          <p className="text-sm text-muted-foreground">
            Used when generating fee invoices
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="Bank Name"
                defaultValue="Bank Muscat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="XXXX XXXX XXXX"
                defaultValue="0123 4567 8901"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              placeholder="OM00 XXXX XXXX XXXX XXXX XXXX"
              defaultValue="OM89 0001 0123 4567 8901 2345"
            />
          </div>
        </div>

        {/* License Upload */}
        <div className="p-4 border-2 border-dashed rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-muted">
              <Icons.fileText className="size-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Expert License Document</p>
              <p className="text-sm text-muted-foreground">
                Upload a scanned copy of your license
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Icons.upload className="mr-2 size-4" />
              Upload
            </Button>
          </div>
        </div>

        <Button className="w-full md:w-auto">
          <Icons.check className="mr-2 size-4" />
          Save Expert Profile
        </Button>
      </CardContent>
    </Card>
  );
}

// Default Fee Structure
function DefaultFeesForm() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Default Fee Structure</CardTitle>
        <CardDescription>
          Pre-fill fees for new cases based on your standard rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="reportFee">Expert Report Fee</Label>
            <div className="flex">
              <Input
                id="reportFee"
                type="number"
                defaultValue="500"
                className="rounded-r-none"
              />
              <span className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm">
                OMR
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="courtFee">Court Appearance</Label>
            <div className="flex">
              <Input
                id="courtFee"
                type="number"
                defaultValue="150"
                className="rounded-r-none"
              />
              <span className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm">
                OMR
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reviewFee">Document Review</Label>
            <div className="flex">
              <Input
                id="reviewFee"
                type="number"
                defaultValue="100"
                className="rounded-r-none"
              />
              <span className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm">
                OMR
              </span>
            </div>
          </div>
        </div>

        <Button variant="outline">
          Save Fee Structure
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="Settings"
        text="Manage your expert profile and account settings."
      />
      <div className="divide-y divide-muted pb-10">
        <UserNameForm user={{ id: user.id, name: user.name || "" }} />
        <ExpertProfileForm />
        <DefaultFeesForm />
        <DeleteAccountSection />
      </div>
    </>
  );
}
