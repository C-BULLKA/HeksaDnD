import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sword, Target, Skull, Shield } from 'lucide-react';

export default function AttackDialog({ isOpen, onClose, result }) {
  if (!result) return null;

  const getTitle = () => {
    if (result.isCritical) return { icon: Skull, text: 'Krytyczne trafienie!', color: 'text-yellow-500' };
    if (result.isFumble) return { icon: Target, text: 'Krytyczna porażka!', color: 'text-red-500' };
    if (result.isHit) return { icon: Sword, text: 'Trafienie!', color: 'text-green-500' };
    return { icon: Shield, text: 'Pudło!', color: 'text-gray-500' };
  };

  const titleData = getTitle();
  const Icon = titleData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${titleData.color}`}>
            <Icon className="w-6 h-6" />
            {titleData.text}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-gray-400 text-sm">Rzut ataku</div>
              <div className={`text-3xl font-bold ${
                result.attackRoll === 20 ? "text-yellow-400" :
                result.attackRoll === 1 ? "text-red-400" :
                "text-blue-400"
              }`}>
                {result.attackRoll}
              </div>
              {result.attackRoll === 20 && <div className="text-yellow-400 text-sm">NAT 20!</div>}
              {result.attackRoll === 1 && <div className="text-red-400 text-sm">NAT 1!</div>}
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-gray-400 text-sm">Obrona celu</div>
              <div className="text-3xl font-bold text-purple-400">
                {result.defenderAC}
              </div>
              <div className="text-gray-500 text-sm">Klasa pancerza</div>
            </div>
          </div>

          {result.isHit && (
            <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg text-center">
              <div className="text-gray-400 text-sm">Zadane obrażenia</div>
              <div className={`text-4xl font-bold ${result.isCritical ? "text-yellow-400" : "text-red-400"}`}>
                {result.damage}
              </div>
              {result.isCritical && (
                <div className="text-yellow-400 text-sm mt-1">Podwójne obrażenia!</div>
              )}
            </div>
          )}

          <div className="text-gray-400 text-sm">
            <strong>{result.attacker?.name}</strong> atakuje <strong>{result.defender?.name}</strong>
            {result.isHit && (
              <span> i zadaje <span className="text-red-400">{result.damage} obrażeń</span>!</span>
            )}
            {!result.isHit && !result.isFumble && (
              <span> ale chybia!</span>
            )}
            {result.isFumble && (
              <span> ale potyka się i traci równowagę!</span>
            )}
          </div>

          {result.defenderHpAfter !== undefined && (
            <div className="text-gray-400 text-sm">
              HP celu: {result.defenderHpAfter}/{result.defender?.maxHp}
              {result.defenderHpAfter <= 0 && (
                <span className="text-red-500 font-bold ml-2">POKONANY!</span>
              )}
            </div>
          )}

          <Button onClick={onClose} className="w-full">
            Zamknij
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}