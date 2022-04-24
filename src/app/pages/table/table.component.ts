import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { FactsResponse, FINDS } from 'src/app/interfaces';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnInit {
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

  public pagesNumber: any;
  public pages: number[] = [];
  public displayedTableInfo: any;
  public activeSort: string = this.params.sortBy;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    if (localStorage.getItem('params')) {
      this.params = JSON.parse(localStorage.getItem('params')!);
    }

    this.getFactsBy(this.params);
  }

  public onSort(el: any) {
    if (el.id !== this.activeSort) {
      this.activeSort = el.id;
      this.displayedTableInfo = this.sortTableBy();
    }

    localStorage.setItem('sortBy', JSON.stringify(this.activeSort));
  }

  public onFormSubmit(form: NgForm) {
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

  public onPageClick(pageIndex: number) {
    this.params = { ...this.params, pageIndex: pageIndex };
    localStorage.setItem('params', JSON.stringify(this.params));
    this.getFactsBy(this.params);
  }

  public resetTable() {
    this.params = {
      ...this.params,
      pageIndex: 0,
      pageSize: 10,
      gteDate: '2018-01-01',
      lteDate: '2018-01-31',
    };

    localStorage.setItem('params', JSON.stringify(this.params));
    this.getFactsBy(this.params);
  }

  private getFactsBy(params: FINDS): void {
    this.apiService.findFactsBy(params).subscribe((response: FactsResponse) => {
      this.pagesNumber = Math.ceil(response.total / this.params.pageSize);
      this.displayedTableInfo = response.entities.map((item: any) => ({
        ...item,
        date: item.date.substring(0, 10).split('-').reverse().join('/'),
      }));

      this.pages = new Array(this.pagesNumber)
        .fill(0)
        .map((el, i) => (el = i + 1));

      if (localStorage.getItem('sortBy')) {
        this.activeSort = JSON.parse(localStorage.getItem('sortBy')!);
        this.displayedTableInfo = this.sortTableBy();
      }
    });
  }

  private sortTableBy() {
    if (this.activeSort !== 'dimension' && this.activeSort !== 'date') {
      return this.displayedTableInfo.sort(
        (a: any, b: any) => a[this.activeSort] - b[this.activeSort]
      );
    } else {
      return this.displayedTableInfo.sort((a: any, b: any) =>
        a[this.activeSort].localeCompare(b[this.activeSort])
      );
    }
  }
}
