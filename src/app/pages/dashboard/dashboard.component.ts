import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AGGREGATE,
  FACTS,
  FactsResponse,
  FACTS_DETAILS,
  FINDS,
} from 'src/app/interfaces';
import { ApiService } from 'src/app/services/api.service';
import { EChartsOption } from 'echarts';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
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

  public popularMerchants: AGGREGATE = {
    dimension: 'merchant',
    types: ['none'],
    gteDate: '2018-01-01',
    lteDate: '2018-01-31',
    includeMetrics: ['volume'],
  };
  public topMerchants: FACTS[] = [];
  public income: FACTS_DETAILS[] = [];
  public subscriptions: Subscription[] = [];

  public chartOptions: { [chart: string]: EChartsOption } = {
    donut: {},
    heatMap: {},
    line: {},
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.subscriptions[0] = this.apiService
      .aggregateTransactionFactsBy(this.spendingCategoriesAndDistribution)
      .subscribe((response: FACTS[]) => {
        this.initializeDonutChart(response);
      });

    this.subscriptions[1] = this.apiService
      .aggregateTransactionFactsBy(this.spendingIntensityByDays)
      .subscribe((response: FACTS[]) => {
        this.initializeHeatmapChart(response);
      });

    this.subscriptions[2] = this.apiService
      .aggregateTransactionFactsBy(this.popularMerchants)
      .subscribe((response: FACTS[]) => {
        const sortedMerchants: FACTS[] = Object.values(response).sort(
          (a, b) => b.volume - a.volume
        );
        this.topMerchants = sortedMerchants.slice(0, 20);
      });

    this.subscriptions[3] = this.apiService
      .findFactsBy(this.incomeByDate)
      .subscribe((response: FactsResponse) => {
        this.income = response.entities.map((fact: FACTS_DETAILS) => ({
          ...fact,
          date: fact.date.substring(8, 10),
        }));

        const lastPage: number = Math.ceil((response.total - 50) / 50);
        this.incomeByDate.pageIndex++;

        for (
          ;
          this.incomeByDate.pageIndex <= lastPage;
          ++this.incomeByDate.pageIndex
        ) {
          this.apiService
            .findFactsBy(this.incomeByDate)
            .subscribe((response2: FactsResponse) => {
              this.income.push(
                ...response2.entities.map((fact: FACTS_DETAILS) => ({
                  ...fact,
                  date: fact.date.substring(8, 10),
                }))
              );
              this.initializeLineChart();
            });
        }
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(
      (subscription: Subscription) => subscription && subscription.unsubscribe()
    );
  }

  private initializeDonutChart(data: FACTS[]): void {
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
        textStyle: {
          color: '#2b2755',
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['50%', '80%'],
          label: {
            show: false,
          },
          data: Object.values(data).map((fact) => ({
            value: fact.volume,
            name: fact.dimension,
          })),
        },
      ],
    };
  }

  private initializeHeatmapChart(data: FACTS[]): void {
    const spending: FACTS[] = Object.values(data);
    const quantityArray: number[] = spending.map((fact) => fact.quantity);
    const sortedQuantityArray: number[] = quantityArray.sort((a, b) => a - b);

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
        textStyle: {
          color: '#2b2755',
        },
      },
      visualMap: {
        min: sortedQuantityArray[0],
        max: sortedQuantityArray[sortedQuantityArray.length - 1],
        type: 'piecewise',
        orient: 'horizontal',
        left: '5',
        top: 50,
      },
      calendar: {
        bottom: 40,
        left: 30,
        right: 30,
        orient: 'horizontal',
        cellSize: ['auto', 13],
        range: spending[0].dimension.substring(0, 4),
        itemStyle: {
          borderWidth: 0.5,
        },
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
  }

  private initializeLineChart(): void {
    const categories: string[] = [];
    const days: string[] = [];

    this.income.map((income: FACTS_DETAILS) => {
      if (!days.includes(income.date.substring(0, 10))) {
        days.push(income.date.substring(0, 10));
      }
      if (!categories.includes(income.dimension)) {
        categories.push(income.dimension);
      }
    });

    this.chartOptions['line'] = {
      title: {
        top: 10,
        left: '5',
        text: 'Income',
        textStyle: {
          color: '#2b2755',
        },
      },
      tooltip: {
        trigger: 'axis',
        textStyle: {
          color: '#2b2755',
        },
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
      },
      legend: {
        top: 10,
        data: categories,
        textStyle: {
          color: '#2b2755',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          data: days,
        },
      ],
      yAxis: [
        {
          type: 'value',
        },
      ],
      series: categories.map((category: string) => ({
        name: category,
        type: 'line',
        stack: 'Total',
        emphasis: {
          focus: 'series',
        },
        data: this.structureDataForChart(days, category, this.income),
      })),
    };
  }

  private structureDataForChart(
    numberOfDays: string[],
    category: string,
    data: FACTS_DETAILS[]
  ): number[] {
    let volumes: number[] = Array(numberOfDays.length).fill(0);
    const filteredCategory: FACTS_DETAILS[] = data.filter(
      (fact: FACTS_DETAILS) => fact.dimension === category
    );
    filteredCategory.forEach((item: FACTS_DETAILS) => {
      let dayIndex = parseInt(item.date) - 1;
      volumes[dayIndex] = item.volume;
    });

    return volumes;
  }
}
