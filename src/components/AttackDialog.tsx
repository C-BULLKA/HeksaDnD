import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sword, Target } from 'lucide-react';
import type { AttackResult } from '@/types/game';

interface AttackDialogProps {
  isOpen: boolean;
  result: AttackResult | null;
  onClose: () => void;
}

const AttackDialog: React.FC<AttackDialogProps> = ({ isOpen, result, onClose }) => {
  if (!result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {result.isCritical ? (
              <>
                <Sword className="w-5 h-5 text-yellow-500" />
                Krytyczne trafienie!
              </>
            ) : result.isFumble ? (
              <>
                <Target className="w-5 h-5 text-red-500" />
                Porażka!
              </>
            ) : result.isHit ? (
              <>
                <Sword className="w-5 h-5 text-green-500" />
                Trafienie!
              </>
            ) : (
              <>
                <Target className="w-5 h-5 text-gray-500" />
                Chybienie!
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {result.attacker.name} atakuje {result.defender.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Rzut ataku</div>
              <div className="text-2xl font-bold text-blue-400">
                {result.attackRoll}
                {result.attackRoll !== 1 && result.attackRoll !== 20 && (
                  <span className="text-sm text-gray-400 ml-1">
                    (+{Math.floor((result.attacker.strength - 10) / 2)})
                  </span>
                )}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Rzut obrony</div>
              <div className="text-2xl font-bold text-red-400">
                {result.defenseRoll || '-'}
                {result.defenseRoll > 0 && (
                  <span className="text-sm text-gray-400 ml-1">
                    (+{Math.floor((result.defender.dexterity - 10) / 2)})
                  </span>
                )}
              </div>
            </div>
          </div>
          {result.isHit && (
            <div className="bg-gray-700 p-3 rounded text-center">
              <div className="text-sm text-gray-400">Zadane obrażenia</div>
              <div className="text-3xl font-bold text-red-500">
                {result.damage}
              </div>
            </div>
          )}
        </div>
        <Button
          onClick={onClose}
          className="w-full mt-4"
        >
          OK
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AttackDialog;
