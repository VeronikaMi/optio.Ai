import { Component, OnInit } from '@angular/core';
import { AGGREGATE, FACTS, FINDS } from 'src/app/interfaces';
import { ApiService } from 'src/app/services/api.service';
import { EChartsOption, SeriesOption } from 'echarts';
import { finalize } from 'rxjs';

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

  public popularMerchants: AGGREGATE = {
    dimension: 'merchant',
    types: ['none'],
    gteDate: '2018-01-01',
    lteDate: '2018-01-31',
    includeMetrics: ['volume'],
  };

  public chartOptions: { [chart: string]: EChartsOption } = {
    donut: {},
    heatMap: {},
    line: {},
  };

  public topMerchants!: FACTS[];
  public income: any;

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
      .aggregateTransactionFactsBy(this.popularMerchants)
      .subscribe((response: FACTS[]) => {
        const sortedMerchants = Object.values(response).sort(
          (a, b) => b.volume - a.volume
        );
        this.topMerchants = sortedMerchants.slice(0, 20);
      });

    // do{}while(this.incomeByDate.pageIndex <= lastPage);?
    this.apiService
      .findFactsBy(this.incomeByDate)
      .subscribe((response: any) => {
        console.log(response);
        this.income = response.entities.map((fact: any) => ({
          ...fact,
          date: fact.date.substring(8, 10),
        }));
        const lastPage = Math.ceil((response.total - 50) / 50);
        this.incomeByDate.pageIndex++;
        const categories: string[] = [];
        const days: string[] = [];

        for (
          ;
          this.incomeByDate.pageIndex <= lastPage;
          ++this.incomeByDate.pageIndex
        ) {
          this.apiService
            .findFactsBy(this.incomeByDate)
            .subscribe((response2: any) => {
              this.income.push(
                ...response2.entities.map((fact: any) => ({
                  ...fact,
                  date: fact.date.substring(8, 10),
                }))
              );

              this.income.map(
                (income: any) =>
                  !days.includes(income.date.substring(0, 10)) &&
                  days.push(income.date.substring(0, 10))
              );

              this.income.map(
                (income: any) =>
                  !categories.includes(income.dimension) &&
                  categories.push(income.dimension)
              );

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
                    boundaryGap: false,
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
            });
        }
      });
  }

  private structureDataForChart(
    numberOfDays: string[],
    category: string,
    data: any
  ) {
    let volumes = Array(numberOfDays.length).fill(0);
    const filteredCategory = data.filter(
      (fact: any) => fact.dimension === category
    );
    filteredCategory.forEach((item: any) => {
      let dayIndex = parseInt(item.date) - 1;
      volumes[dayIndex] = item.volume;
    });

    return volumes;
  }
}
