import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { Plus, Trash2, MapPin, User, FileText } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

type MemberForm = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  relationshipToHead: string;
  nationalId: string;
  disabilityStatus: boolean;
};

type HouseholdForm = {
  province: string;
  district: string;
  village: string;
  gpsCoordinates: string;
  housingType: string;
  incomeSource: string;
  notes: string;
};

export function Registration() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [members, setMembers] = useState<MemberForm[]>([
    {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      relationshipToHead: "head",
      nationalId: "",
      disabilityStatus: false,
    }
  ]);

  const createHouseholdMutation = useMutation({
    mutationFn: async (data: { household: any; members: any[] }) => {
      const response = await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to register household");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Intake Successful",
        description: "Household has been added and queued for assessment.",
      });
      setTimeout(() => setLocation("/"), 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const household = {
      province: formData.get("province") as string,
      district: formData.get("district") as string,
      village: formData.get("village") as string,
      gpsCoordinates: formData.get("gps") as string || null,
      programStatus: "pending_assessment",
    };

    const formattedMembers = members.map((member, index) => ({
      firstName: formData.get(`firstName-${index}`) as string,
      lastName: formData.get(`lastName-${index}`) as string,
      dateOfBirth: new Date(formData.get(`dateOfBirth-${index}`) as string),
      gender: formData.get(`gender-${index}`) as string,
      relationshipToHead: index === 0 ? "head" : (formData.get(`relationship-${index}`) as string),
      nationalId: formData.get(`nationalId-${index}`) as string || null,
      disabilityStatus: formData.get(`disability-${index}`) === "on",
      isHead: index === 0,
    }));

    createHouseholdMutation.mutate({
      household,
      members: formattedMembers,
    });
  };

  const addMember = () => {
    setMembers([...members, {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      relationshipToHead: "",
      nationalId: "",
      disabilityStatus: false,
    }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      const newMembers = [...members];
      newMembers.splice(index, 1);
      setMembers(newMembers);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Household Intake</h1>
          <p className="text-muted-foreground">Create a new household profile for the Public Assistance Program.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            
            {/* Location Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>Location & Address</CardTitle>
                </div>
                <CardDescription>Geographic location of the household dwelling.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="province">Province/Region</Label>
                  <Select name="province" required>
                    <SelectTrigger id="province" data-testid="select-province">
                      <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Central Province">Central Province</SelectItem>
                      <SelectItem value="Eastern Province">Eastern Province</SelectItem>
                      <SelectItem value="Western Province">Western Province</SelectItem>
                      <SelectItem value="Northern Province">Northern Province</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Select name="district" required>
                    <SelectTrigger id="district" data-testid="select-district">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Capital District">Capital District</SelectItem>
                      <SelectItem value="River District">River District</SelectItem>
                      <SelectItem value="Mountain District">Mountain District</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="village">Village / Community</Label>
                  <Input id="village" name="village" placeholder="Enter village name" required data-testid="input-village" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gps">GPS Coordinates (Optional)</Label>
                  <div className="flex gap-2">
                    <Input id="gps" name="gps" placeholder="Lat, Long" data-testid="input-gps" />
                    <Button type="button" variant="outline" size="icon" title="Get Current Location" data-testid="button-gps">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Household Members */}
            <Card>
              <CardHeader>
                 <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle>Household Roster</CardTitle>
                  </div>
                  <Button type="button" onClick={addMember} variant="outline" size="sm" className="gap-2" data-testid="button-add-member">
                    <Plus className="h-4 w-4" /> Add Member
                  </Button>
                </div>
                <CardDescription>Enter details for Head of Household and all dependents.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {members.map((member, index) => (
                  <div key={index} className="relative animate-in fade-in slide-in-from-bottom-2">
                    {index > 0 && <Separator className="my-6" />}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                        {index === 0 ? "Head of Household" : `Member #${index + 1}`}
                      </h3>
                      {index > 0 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeMember(index)} 
                          className="text-destructive hover:bg-destructive/10"
                          data-testid={`button-remove-member-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input name={`firstName-${index}`} placeholder="Given Name" required data-testid={`input-firstname-${index}`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input name={`lastName-${index}`} placeholder="Surname" required data-testid={`input-lastname-${index}`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input name={`dateOfBirth-${index}`} type="date" required data-testid={`input-dob-${index}`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select name={`gender-${index}`} required>
                          <SelectTrigger data-testid={`select-gender-${index}`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Relationship to Head</Label>
                        <Select name={`relationship-${index}`} defaultValue={index === 0 ? "head" : undefined} disabled={index === 0}>
                          <SelectTrigger data-testid={`select-relationship-${index}`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="head">Self (Head)</SelectItem>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="other">Other Relative</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>National ID / Ref #</Label>
                        <Input name={`nationalId-${index}`} placeholder="ID Number" data-testid={`input-nationalid-${index}`} />
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox id={`disability-${index}`} name={`disability-${index}`} data-testid={`checkbox-disability-${index}`} />
                      <Label htmlFor={`disability-${index}`} className="font-normal text-muted-foreground">
                        This member has a documented disability
                      </Label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardFooter className="bg-muted/50 flex justify-end gap-4 p-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/")}
                  disabled={createHouseholdMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="min-w-[150px]"
                  disabled={createHouseholdMutation.isPending}
                  data-testid="button-submit"
                >
                  {createHouseholdMutation.isPending ? "Submitting..." : "Submit Intake"}
                </Button>
              </CardFooter>
            </Card>

          </div>
        </form>
      </main>
    </div>
  );
}
