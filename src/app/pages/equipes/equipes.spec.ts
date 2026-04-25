import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Equipes, EquipeMode } from './equipes';
import { TeamService } from '../../core/team/team.service';
import { TeamSlot } from '../../core/team/team.model';
import { PokemonCardModel } from '../../shared/models/pokemon.card.model';
import { Move as MoveModel } from '../../shared/models/move.model';

const mockTeamSlot: TeamSlot = {
  slotIndex: 0,
  pokedexId: 25,
  name: 'Pikachu',
  sprite: 'https://example.com/pikachu.png',
  spriteBack: 'https://example.com/pikachu-back.png',
  types: ['electric'],
  hp: 35,
  hpMax: 35,
  stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
  moves: [
    { slot: 0, name: 'thunderbolt', frenchName: 'Tonnerre', type: 'electric', power: 90, accuracy: 100, damageClass: 'special' },
    { slot: 1, name: '', frenchName: '', type: 'normal', power: null, accuracy: 100, damageClass: 'physical' },
    { slot: 2, name: '', frenchName: '', type: 'normal', power: null, accuracy: 100, damageClass: 'physical' },
    { slot: 3, name: '', frenchName: '', type: 'normal', power: null, accuracy: 100, damageClass: 'physical' },
  ],
};

const mockPokemon: PokemonCardModel = {
  pokedex_id: 25,
  name: 'Pikachu',
  types: ['electric'],
  sprite: 'https://example.com/pikachu.png',
  stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
};

const mockMove: MoveModel = {
  name: 'thunderbolt',
  frenchName: 'Tonnerre',
  type: 'electric',
  power: 90,
  accuracy: 100,
  damageClass: 'special',
};

function makeTeamSvc(slots: (TeamSlot | null)[] = Array(6).fill(null)) {
  const _slots = signal<(TeamSlot | null)[]>(slots);
  return {
    _slots,
    slots: _slots.asReadonly(),
    setSlot: vi.fn(),
    clearSlot: vi.fn(),
    saveTeam: vi.fn(),
    setMove: vi.fn(),
  };
}

describe('Equipes', () => {
  let component: Equipes;
  let fixture: ComponentFixture<Equipes>;
  let teamSvc: ReturnType<typeof makeTeamSvc>;

  async function setup(slots: (TeamSlot | null)[] = Array(6).fill(null)) {
    teamSvc = makeTeamSvc(slots);
    await TestBed.configureTestingModule({
      imports: [Equipes],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TeamService, useValue: teamSvc },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Equipes);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  describe('toggleCard()', () => {
    it('deselects the current card and sets mode to AUCUN when toggled again', async () => {
      await setup();
      component.toggleCard(1);
      component.toggleCard(1);
      expect(component.selected_card()).toBe(0);
      expect(component.selectedMode()).toBe(EquipeMode.AUCUN);
    });

    it('sets mode to CHOIX_POKEMON for an empty slot', async () => {
      await setup();
      component.toggleCard(1);
      expect(component.selected_card()).toBe(1);
      expect(component.selectedMode()).toBe(EquipeMode.CHOIX_POKEMON);
    });

    it('sets mode to AFFICHAGE_POKEMON for an occupied slot', async () => {
      const slots = [mockTeamSlot, ...Array(5).fill(null)] as (TeamSlot | null)[];
      await setup(slots);
      component.toggleCard(1);
      expect(component.selected_card()).toBe(1);
      expect(component.selectedMode()).toBe(EquipeMode.AFFICHAGE_POKEMON);
    });
  });

  describe('changeMode()', () => {
    it('updates the selected mode', async () => {
      await setup();
      component.changeMode(EquipeMode.CHOIX_POKEMON);
      expect(component.selectedMode()).toBe(EquipeMode.CHOIX_POKEMON);
    });

    it('can switch between all modes', async () => {
      await setup();
      component.changeMode(EquipeMode.CHOIX_ATTACK);
      expect(component.selectedMode()).toBe(EquipeMode.CHOIX_ATTACK);
      component.changeMode(EquipeMode.AUCUN);
      expect(component.selectedMode()).toBe(EquipeMode.AUCUN);
    });
  });

  describe('choosePokemon()', () => {
    it('does nothing when no card is selected (slot = 0)', async () => {
      await setup();
      component.choosePokemon(mockPokemon);
      expect(teamSvc.setSlot).not.toHaveBeenCalled();
    });

    it('calls setSlot and saveTeam then switches to AFFICHAGE_POKEMON', async () => {
      await setup();
      component.selected_card.set(1);
      component.choosePokemon(mockPokemon);
      expect(teamSvc.setSlot).toHaveBeenCalled();
      expect(teamSvc.saveTeam).toHaveBeenCalled();
      expect(component.selectedMode()).toBe(EquipeMode.AFFICHAGE_POKEMON);
    });
  });

  describe('onPokemonChosen()', () => {
    it('delegates to choosePokemon', async () => {
      await setup();
      component.selected_card.set(2);
      (component as any).onPokemonChosen(mockPokemon);
      expect(teamSvc.setSlot).toHaveBeenCalled();
    });
  });

  describe('changeToMoveMode()', () => {
    it('sets idFocusMove and switches to CHOIX_ATTACK mode', async () => {
      await setup();
      (component as any).changeToMoveMode(2);
      expect(component.idFocusMove()).toBe(2);
      expect(component.selectedMode()).toBe(EquipeMode.CHOIX_ATTACK);
    });
  });

  describe('onMovesLoaded()', () => {
    it('stores the available moves for selection', async () => {
      await setup();
      (component as any).onMovesLoaded([mockMove]);
      expect(component.availableMovesForSelected).toEqual([mockMove]);
    });
  });

  describe('onMoveSelected()', () => {
    it('does nothing when no card is selected', async () => {
      await setup();
      (component as any).onMoveSelected(mockMove);
      expect(teamSvc.setMove).not.toHaveBeenCalled();
    });

    it('does nothing when idFocusMove is 0', async () => {
      await setup();
      component.selected_card.set(1);
      component.idFocusMove.set(0);
      (component as any).onMoveSelected(mockMove);
      expect(teamSvc.setMove).not.toHaveBeenCalled();
    });

    it('calls setMove and saveTeam then switches to AFFICHAGE_POKEMON', async () => {
      await setup();
      component.selected_card.set(1);
      component.idFocusMove.set(1);
      (component as any).onMoveSelected(mockMove);
      expect(teamSvc.setMove).toHaveBeenCalledWith(0, 0, expect.objectContaining({ name: 'thunderbolt' }));
      expect(teamSvc.saveTeam).toHaveBeenCalled();
      expect(component.selectedMode()).toBe(EquipeMode.AFFICHAGE_POKEMON);
    });
  });

  describe('removePokemon()', () => {
    it('does nothing when no card is selected', async () => {
      await setup();
      (component as any).removePokemon();
      expect(teamSvc.clearSlot).not.toHaveBeenCalled();
    });

    it('clears the slot, saves, and resets selection state', async () => {
      await setup();
      component.selected_card.set(2);
      (component as any).removePokemon();
      expect(teamSvc.clearSlot).toHaveBeenCalledWith(1);
      expect(teamSvc.saveTeam).toHaveBeenCalled();
      expect(component.selectedMode()).toBe(EquipeMode.AUCUN);
      expect(component.selected_card()).toBe(0);
      expect(component.idFocusMove()).toBe(0);
    });
  });
});
