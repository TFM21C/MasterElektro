import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { ProjectType } from '@/types/circuit';
import { ProjectTypes } from '@/types/circuit';

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectName: string, projectType: ProjectType) => void;
}

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ isOpen, onClose, onCreate }) => {
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('Steuerstromkreis');

  const handleCreate = () => {
    onCreate(projectName || 'Unbenanntes Projekt', projectType);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neues Projekt</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-name" className="text-right">
              Projektname
            </Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-type" className="text-right">
              Projekttyp
            </Label>
            <Select value={projectType} onValueChange={(val) => setProjectType(val as ProjectType)}>
              <SelectTrigger id="project-type" className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ProjectTypes.map((pt) => (
                  <SelectItem key={pt} value={pt}>
                    {pt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Abbrechen
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleCreate}>
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;
