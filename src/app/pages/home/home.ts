import {Component, OnInit, OnDestroy} from '@angular/core';
import { Subscription } from 'rxjs';
import { PokeApiService } from '../../shared/services/pokeApi-service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  private sub?: Subscription;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private pokeService: PokeApiService) {}

  ngOnInit() {
    this.isLoading = true;
    this.sub = this.pokeService.getPokedex().subscribe({
      next: (pokedex) => {
        console.log('PokeApiService.getPokedex result:', pokedex);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching pokedex:', err);
        this.errorMessage = err?.message || 'Erreur lors du chargement du Pokédex';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined;
    }
  }
}
