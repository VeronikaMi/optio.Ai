import { Component, OnInit } from '@angular/core';
import { AGGREGATE, FACTS, FINDS } from 'src/app/interfaces';
import { ApiService } from 'src/app/services/api.service';
import { EChartsOption, time as eTime, number } from 'echarts';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  public spendingCategoriesAndDistribution: AGGREGATE = {
    dimension: 'parent-category',
    types: ['spending', 'withdrawal'],
    gteDate: '2018-01-01',
    lteDate: '2018-01-31',
    includeMetrics: ['volume'],
  };

  public spendingIntensityByDays: AGGREGATE = {
    dimension: 'date',
    types: ['spending', 'withdrawal'],
    gteDate: '2018-01-01',
    lteDate: '2018-01-31',
    includeMetrics: ['volume', 'quantity'],
  };

  public incomeByDate: FINDS = {
    dimension: 'category',
    types: ['income'],
    gteDate: '2018-01-01',
    lteDate: '2018-01-31',
    sortBy: 'date',
    sortDirection: 'asc',
    pageIndex: 0,
    pageSize: 50,
    includes: ['dimension', 'date', 'volume'],
  };

  public chartOptions: { [chart: string]: EChartsOption } = {
    donut: {},
    heatMap: {},
    line: {},
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService
      .aggregateTransactionFactsBy(this.spendingCategoriesAndDistribution)
      .subscribe((response: FACTS[]) => {
        this.chartOptions['donut'] = {
          title: {
            text: 'Spendings',
            top: '10',
            left: '5',
            textStyle: {
              color: '#2b2755',
            },
          },
          tooltip: {
            trigger: 'item',
          },
          series: [
            {
              type: 'pie',
              radius: ['50%', '80%'],
              avoidLabelOverlap: false,
              label: {
                show: false,
                position: 'center',
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '20',
                  fontWeight: 'bold',
                },
              },
              labelLine: {
                show: false,
              },
              data: Object.values(response).map((fact) => ({
                value: fact.volume,
                name: fact.dimension,
              })),
            },
          ],
        };
      });

    this.apiService
      .aggregateTransactionFactsBy(this.spendingIntensityByDays)
      .subscribe((response: FACTS[]) => {
        const spending: FACTS[] = Object.values(response);
        const quantityArray: number[] = spending.map((fact) => fact.quantity);
        const sortedQuantityArray: number[] = quantityArray.sort(
          (a, b) => a - b
        );

        this.chartOptions['heatMap'] = {
          title: {
            top: 10,
            left: '5',
            text: 'Daily Transaction Number ',
            textStyle: {
              color: '#2b2755',
            },
          },
          tooltip: {
            show: true,
            trigger: 'item',
          },
          visualMap: {
            min: sortedQuantityArray[0],
            max: sortedQuantityArray[sortedQuantityArray.length - 1],
            type: 'piecewise',
            orient: 'horizontal',
            left: '5',
            bottom: 50,
          },
          calendar: {
            top: 100,
            left: 30,
            right: 30,
            cellSize: ['auto', 13],
            range: spending[0].dimension.substring(0, 4),
            itemStyle: {
              borderWidth: 0.5,
            },
            yearLabel: { show: false },
          },
          series: {
            name: 'Transactions',
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: spending.map((fact) => [
              Object.values(fact)[0].substring(0, 10),
              Object.values(fact)[4],
            ]),
          },
        };
      });

    this.apiService
      .findFactsBy(this.incomeByDate)
      .subscribe((response: any) => {
        console.log(response);
        const income = response.entities;
        const total = response.total;
        console.log(Math.floor(total / 50));
        for (let i = 0; i < Math.ceil(total / 50); ++i) {
          this.apiService
            .findFactsBy({
              ...this.incomeByDate,
              pageIndex: this.incomeByDate.pageIndex++,
            })
            .subscribe((response2: any) => {
              income.push(...response2.entities);
            });
        }

        console.log(income);
      });
  }
}
