import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StarStats } from './star-stats';

describe('StarStats', () => {
  let component: StarStats;
  let fixture: ComponentFixture<StarStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarStats],
    }).compileComponents();

    fixture = TestBed.createComponent(StarStats);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
