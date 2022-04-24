import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FactsResponse, FINDS, TABLE_DATA } from 'src/app/interfaces';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnInit, OnDestroy {
  public params: FINDS = {
    dimension: 'category',
    types: ['income'],
    gteDate: '2018-01-01',
    lteDate: '2018-01-31',
    sortBy: 'date',
    sortDirection: 'asc',
    pageIndex: 0,
    pageSize: 10,
    includes: [
      'dimension',
      'date',
      'quantity',
      'volume',
      'average',
      'differenceQuantity',
      'differenceVolume',
    ],
  };

  public pages: number[] = [];
  public displayedTableInfo: TABLE_DATA[] = [];
  public subscription: Subscription = new Subscription();

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    if (localStorage.getItem('params')) {
      this.params = JSON.parse(localStorage.getItem('params')!);
    }

    this.getFactsBy(this.params);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public onSort(el: any): void {
    if (
      el.id !== this.params.sortBy ||
      (el.id === this.params.sortBy && this.params.sortDirection === 'desc')
    ) {
      this.params = { ...this.params, sortBy: el.id, sortDirection: 'asc' };
    } else {
      this.params = { ...this.params, sortBy: el.id, sortDirection: 'desc' };
    }
    this.getFactsBy(this.params);

    localStorage.setItem('params', JSON.stringify(this.params));
  }

  public onFormSubmit(form: NgForm): void {
    if (form.touched) {
      this.params = {
        ...this.params,
        gteDate: form.value.gteDate,
        lteDate: form.value.lteDate,
        pageSize: form.value.itemNumber,
      };

      localStorage.setItem('params', JSON.stringify(this.params));
      this.getFactsBy(this.params);
    }
  }

  public onPageClick(pageIndex: number): void {
    this.params = { ...this.params, pageIndex: pageIndex };
    localStorage.setItem('params', JSON.stringify(this.params));
    this.getFactsBy(this.params);
  }

  public resetTable(): void {
    this.params = {
      ...this.params,
      pageIndex: 0,
      pageSize: 10,
      gteDate: '2018-01-01',
      lteDate: '2018-01-31',
      sortBy: 'date',
      sortDirection: 'asc',
    };

    localStorage.setItem('params', JSON.stringify(this.params));
    this.getFactsBy(this.params);
  }

  private getFactsBy(params: FINDS): void {
    this.subscription = this.apiService
      .findFactsBy(params)
      .subscribe((response: FactsResponse) => {
        const pagesNumber = Math.ceil(response.total / this.params.pageSize);
        this.displayedTableInfo = response.entities.map((item: TABLE_DATA) => ({
          ...item,
          date: item.date.substring(0, 10).split('-').reverse().join('/'),
        }));

        this.pages = new Array(pagesNumber)
          .fill(0)
          .map((el, i) => (el = i + 1));
      });
  }
}
