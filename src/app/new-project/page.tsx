
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectType } from '@/types/circuit';
import { ProjectTypes } from '@/types/circuit'; // Import the array of project types
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType | ''>('');
  const [creatorName, setCreatorName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Der Projektname darf nicht leer sein.");
      return;
    }
    if (!projectType) {
      setError("Bitte wählen Sie einen Projekttyp aus.");
      return;
    }
    setError(null);

    // For now, we just navigate. Later, this would involve saving to Firebase.
    const queryParams = new URLSearchParams({
      projectName: projectName.trim(),
      projectType: projectType,
    });
    if (creatorName.trim()) {
      queryParams.append('creatorName', creatorName.trim());
    }
    router.push(`/designer?${queryParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
       <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" passHref>
                <Button variant="outline" size="sm" className="flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück zur Startseite
                </Button>
            </Link>
            <div></div> {/* Spacer */}
          </div>
          <img src="https://placehold.co/100x100.png" alt="Project Icon" data-ai-hint="project document" className="mx-auto mb-4 rounded-lg" />
          <CardTitle className="text-3xl font-bold text-primary">Neues Projekt erstellen</CardTitle>
          <CardDescription>
            Geben Sie die Details für Ihr neues Schaltungsprojekt ein.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-lg font-medium">
                Name des Projekts <span className="text-destructive">*</span>
              </Label>
              <Input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="z.B. Motorsteuerung K1"
                className="text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectType" className="text-lg font-medium">
                Art des Projekts <span className="text-destructive">*</span>
              </Label>
              <Select
                value={projectType}
                onValueChange={(value) => setProjectType(value as ProjectType)}
                required
              >
                <SelectTrigger id="projectType" className="text-base h-11">
                  <SelectValue placeholder="Projekttyp auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {ProjectTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-base">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creatorName" className="text-lg font-medium">
                Name des Erstellers (optional)
              </Label>
              <Input
                id="creatorName"
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="z.B. Max Mustermann"
                className="text-base"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full text-lg py-6">
              Projekt erstellen und Designer öffnen
            </Button>
          </form>
        </CardContent>
      </Card>
      <footer className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          CircuitCraft &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
