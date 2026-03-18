import {Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input, OnChanges, SimpleChanges} from '@angular/core';
import * as echarts from 'echarts';
import {PokemonStats} from '../../models/pokemon-stats.model';

@Component({
  selector: 'app-star-stats',
  templateUrl: './star-stats.html',
  styleUrls: ['./star-stats.css'],
})

/**
 * Affichage de statistiques de Pokémon sous forme d'étoile (radar chart) avec ECharts.
 */
export class StarStats implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('chartContainer', { static: false })
  chartContainer!: ElementRef<HTMLDivElement>;

  private chart: echarts.ECharts | null = null;

  @Input() stats: PokemonStats = {} as PokemonStats;

  private buildChartOptions(): echarts.EChartsOption {
    const hp = this.stats?.hp ?? 0;
    const attack = this.stats?.attack ?? 0;
    const defense = this.stats?.defense ?? 0;
    const spAtk = this.stats?.specialAttack ?? 0;
    const spDef = this.stats?.specialDefense ?? 0;
    const speed = this.stats?.speed ?? 0;
    const maximumStatValue = 255; // Valeur max pour les stats de Pokémon

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        textStyle: {
          color: '#fff',
        },
      },
      radar: {
        radius: '90%', // agrandir l'étoile (plus proche des bords du container)
        center: ['50%', '50%'],
        indicator: [
          { name: 'PV', max: maximumStatValue },
          { name: 'Attaque', max: maximumStatValue },
          { name: 'Défense', max: maximumStatValue },
          { name: 'Attaque Sp.', max: maximumStatValue },
          { name: 'Défense Sp.', max: maximumStatValue },
          { name: 'Vitesse', max: maximumStatValue },
        ],
        shape: 'polygon',
        splitNumber: 5,
        axisName: {
          color: '#FFDE00',
          fontSize: 14,
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 222, 0, 0.05)',
          },
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(255, 222, 0, 0.06)', 'rgba(255, 222, 0, 0.03)'],
          },
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 222, 0, 0.5)',
          },
        },
      },
      series: [
        {
          name: 'Stats',
          type: 'radar',
          data: [
            {
              value: [hp, attack, defense, spAtk, spDef, speed],
              name: 'Pokémon',
              label: {
                show: true,
                formatter: (params: any) => `${params.value}`,
                color: '#fff',
                fontSize: 12,
                fontWeight: 'bold',
              },
              areaStyle: {
                color: 'rgba(255, 222, 0, 0.5)',
              },
              lineStyle: {
                color: '#FFDE00',
                width: 2,
              },
              symbol: 'circle',
            },
          ],
        },
      ],
    } as echarts.EChartsOption;
  }

  ngAfterViewInit(): void {
    // Initialiser le chart seulement si l'élément existe
    if (!this.chartContainer || !this.chartContainer.nativeElement) return;

    try {
      this.chart = echarts.init(this.chartContainer.nativeElement);
      // Use the built options which depend on @Input stats
      this.chart.setOption(this.buildChartOptions());
    } catch (e) {
      // Fail silently for UI stability but keep console info commented for dev
      // console.warn('ECharts init failed', e);
    }

    // Redimensionnement responsive
    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If stats input changes after init, update the chart
    if (this.chart && changes['stats']) {
      try {
        this.chart.setOption(this.buildChartOptions());
      } catch (e) {
        // console.warn('ECharts update failed', e);
      }
    }
  }

  private onWindowResize = () => {
    if (this.chart) {
      this.chart.resize();
    }
  };

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onWindowResize);
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }
}
