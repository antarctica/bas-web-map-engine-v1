<?xml version="1.0" encoding="ISO-8859-1"?>
<StyledLayerDescriptor version="1.0.0"
                       xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd"
                       xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc"
                       xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <NamedLayer>
    <Name>ops_latest_field_deployments</Name>
    <UserStyle>
      <Title>ops_latest_field_deployments</Title>
      <FeatureTypeStyle>
        <Rule>
          <Title>Alpha</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Alpha</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#ff9900</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Bravo</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Bravo</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#a3f2c6</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Charlie</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Charlie</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#ed1080</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
        <Rule>
          <Title>Delta</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Delta</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#810d63</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Echo</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Echo</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#08981d</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Foxtrot</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Foxtrot</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#440470</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Golf</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Golf</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#f8628a</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Hotel</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Hotel</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#304490</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>India</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>India</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#7c6525</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Juliett</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Juliett</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#dce84c</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Kilo</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Kilo</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#ce39cf</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Lima</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Lima</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#6fc8da</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Mike</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Mike</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#f5ca00</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>November</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>November</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#4c47b7</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule> <Rule>
        <Title>Oscar</Title>
        <ogc:Filter>
          <ogc:And>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>sledge</ogc:PropertyName>
              <ogc:Literal>Oscar</ogc:Literal>
            </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
          </ogc:And>
        </ogc:Filter>
        <PointSymbolizer>
          <Graphic>
            <Mark>
              <WellKnownName>circle</WellKnownName>
              <Fill>
                <CssParameter name="fill">#f35915</CssParameter>
              </Fill>                
              <Stroke>
                <CssParameter name="stroke">#000000</CssParameter>
                <CssParameter name="stroke-width">0.5</CssParameter>
              </Stroke>
            </Mark>
            <Size>10</Size>
          </Graphic>
        </PointSymbolizer>

        </Rule> <Rule>
        <Title>Papa</Title>
        <ogc:Filter>
          <ogc:And>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>sledge</ogc:PropertyName>
              <ogc:Literal>Papa</ogc:Literal>
            </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
          </ogc:And>
        </ogc:Filter>
        <PointSymbolizer>
          <Graphic>
            <Mark>
              <WellKnownName>circle</WellKnownName>
              <Fill>
                <CssParameter name="fill">#cb94c9</CssParameter>
              </Fill>                
              <Stroke>
                <CssParameter name="stroke">#000000</CssParameter>
                <CssParameter name="stroke-width">0.5</CssParameter>
              </Stroke>
            </Mark>
            <Size>10</Size>
          </Graphic>
        </PointSymbolizer>

        </Rule> <Rule>
        <Title>Quebec</Title>
        <ogc:Filter>
          <ogc:And>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>sledge</ogc:PropertyName>
              <ogc:Literal>Quebec</ogc:Literal>
            </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
          </ogc:And>
        </ogc:Filter>
        <PointSymbolizer>
          <Graphic>
            <Mark>
              <WellKnownName>circle</WellKnownName>
              <Fill>
                <CssParameter name="fill">#1a5bbd</CssParameter>
              </Fill>                
              <Stroke>
                <CssParameter name="stroke">#000000</CssParameter>
                <CssParameter name="stroke-width">0.5</CssParameter>
              </Stroke>
            </Mark>
            <Size>10</Size>
          </Graphic>
        </PointSymbolizer>

        </Rule> 
        <Rule>
          <Title>Romeo</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Romeo</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#22161b</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule> <Rule>
        <Title>Sierra</Title>
        <ogc:Filter>
          <ogc:And>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>sledge</ogc:PropertyName>
              <ogc:Literal>Sierra</ogc:Literal>
            </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
          </ogc:And>
        </ogc:Filter>
        <PointSymbolizer>
          <Graphic>
            <Mark>
              <WellKnownName>circle</WellKnownName>
              <Fill>
                <CssParameter name="fill">#924c30</CssParameter>
              </Fill>                
              <Stroke>
                <CssParameter name="stroke">#000000</CssParameter>
                <CssParameter name="stroke-width">0.5</CssParameter>
              </Stroke>
            </Mark>
            <Size>10</Size>
          </Graphic>
        </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Tango</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Tango</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#db5c66</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Uniform</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Uniform</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#4f768b</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Victor</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Victor</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">##f99e73</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Whiskey</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Whiskey</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#fceba6</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>X-ray</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>X-ray</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#fb5c5b</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Yankee</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Yankee</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#6bff8e</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
        <Rule>
          <Title>Zulu</Title>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>sledge</ogc:PropertyName>
                <ogc:Literal>Zulu</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>updated</ogc:PropertyName>
                <ogc:Literal>2019-10-01</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#b1aaca</CssParameter>
                </Fill>                
                <Stroke>
                  <CssParameter name="stroke">#000000</CssParameter>
                  <CssParameter name="stroke-width">0.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>

        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>