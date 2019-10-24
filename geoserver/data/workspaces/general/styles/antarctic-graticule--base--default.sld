<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd">
    <NamedLayer>
        <Name>Graticule styles</Name>
        <UserStyle>
            <Name>normal</Name>
            <Title>Antarctic Graticule lines</Title>
            <Abstract>Provides a symbolization for Antarctic graticules</Abstract>
            <FeatureTypeStyle>
                <FeatureTypeName>Feature</FeatureTypeName>
                <Rule>
                    <Name>Latitude line (max scale)</Name>
                    <Title>Latitude line (max scale)</Title>
                    <ogc:Filter>
                        <ogc:And>
                            <ogc:PropertyIsEqualTo>
                                <ogc:PropertyName>islatitude</ogc:PropertyName>
                                <ogc:Literal>T</ogc:Literal>
                            </ogc:PropertyIsEqualTo>
                            <ogc:PropertyIsGreaterThanOrEqualTo>
                                <ogc:PropertyName>increment</ogc:PropertyName>
                                <ogc:Literal>5</ogc:Literal>
                            </ogc:PropertyIsGreaterThanOrEqualTo>
                        </ogc:And>
                    </ogc:Filter>
                    <MinScaleDenominator>10000000</MinScaleDenominator>
                    <LineSymbolizer>
                        <Stroke>
                            <CssParameter name="stroke">#888888</CssParameter>
                            <CssParameter name="stroke-width">0.2</CssParameter>
                            <CssParameter name="stroke-opacity">0.4</CssParameter>
                        </Stroke>
                    </LineSymbolizer>
                    <TextSymbolizer>
                        <Label>
                            <ogc:PropertyName>label</ogc:PropertyName>
                        </Label>
                        <Font>
                            <CssParameter name="font-family">SansSerif</CssParameter>
                            <CssParameter name="font-size">10</CssParameter>
                        </Font>
                        <LabelPlacement>
                            <LinePlacement>
                                <PerpendicularOffset>5</PerpendicularOffset>
                            </LinePlacement>
                        </LabelPlacement>
                        <Fill>
                            <CssParameter name="fill">#aaaaaa</CssParameter>
                            <CssParameter name="fill-opacity">0.8</CssParameter>
                        </Fill>
                        <VendorOption name="group">yes</VendorOption>
                    </TextSymbolizer>
                </Rule>
                <Rule>
                    <Name>Latitude line (10m)</Name>
                    <Title>Latitude line (10m)</Title>
                    <ogc:Filter>
                        <ogc:And>
                            <ogc:PropertyIsEqualTo>
                                <ogc:PropertyName>islatitude</ogc:PropertyName>
                                <ogc:Literal>T</ogc:Literal>
                            </ogc:PropertyIsEqualTo>
                            <ogc:PropertyIsGreaterThanOrEqualTo>
                                <ogc:PropertyName>increment</ogc:PropertyName>
                                <ogc:Literal>4</ogc:Literal>
                            </ogc:PropertyIsGreaterThanOrEqualTo>
                        </ogc:And>
                    </ogc:Filter>
                    <MinScaleDenominator>5000000</MinScaleDenominator>
                    <MaxScaleDenominator>10000000</MaxScaleDenominator>
                    <LineSymbolizer>
                        <Stroke>
                            <CssParameter name="stroke">#888888</CssParameter>
                            <CssParameter name="stroke-width">0.6</CssParameter>
                            <CssParameter name="stroke-opacity">0.4</CssParameter>
                        </Stroke>
                    </LineSymbolizer>
                    <TextSymbolizer>
                        <Label>
                            <ogc:PropertyName>label</ogc:PropertyName>
                        </Label>
                        <Font>
                            <CssParameter name="font-family">SansSerif</CssParameter>
                            <CssParameter name="font-size">10</CssParameter>
                        </Font>
                        <LabelPlacement>
                            <LinePlacement>
                                <PerpendicularOffset>5</PerpendicularOffset>
                            </LinePlacement>
                        </LabelPlacement>
                        <Fill>
                            <CssParameter name="fill">#aaaaaa</CssParameter>
                            <CssParameter name="fill-opacity">0.8</CssParameter>
                        </Fill>
                        <VendorOption name="group">yes</VendorOption>
                    </TextSymbolizer>
                </Rule>
                <Rule>
                    <Name>Latitude line (5m)</Name>
                    <Title>Latitude line (5m)</Title>
                    <ogc:Filter>
                        <ogc:And>
                            <ogc:PropertyIsEqualTo>
                                <ogc:PropertyName>islatitude</ogc:PropertyName>
                                <ogc:Literal>T</ogc:Literal>
                            </ogc:PropertyIsEqualTo>
                            <ogc:PropertyIsGreaterThanOrEqualTo>
                                <ogc:PropertyName>increment</ogc:PropertyName>
                                <ogc:Literal>3</ogc:Literal>
                            </ogc:PropertyIsGreaterThanOrEqualTo>
                        </ogc:And>
                    </ogc:Filter>
                    <MinScaleDenominator>500000</MinScaleDenominator>
                    <MaxScaleDenominator>5000000</MaxScaleDenominator>
                    <LineSymbolizer>
                        <Stroke>
                            <CssParameter name="stroke">#888888</CssParameter>
                            <CssParameter name="stroke-width">1.0</CssParameter>
                            <CssParameter name="stroke-opacity">0.4</CssParameter>
                        </Stroke>
                    </LineSymbolizer>
                    <TextSymbolizer>
                        <Label>
                            <ogc:PropertyName>label</ogc:PropertyName>
                        </Label>
                        <Font>
                            <CssParameter name="font-family">SansSerif</CssParameter>
                            <CssParameter name="font-size">10</CssParameter>
                        </Font>
                        <LabelPlacement>
                            <LinePlacement>
                                <PerpendicularOffset>5</PerpendicularOffset>
                            </LinePlacement>
                        </LabelPlacement>
                        <Fill>
                            <CssParameter name="fill">#aaaaaa</CssParameter>
                            <CssParameter name="fill-opacity">0.8</CssParameter>
                        </Fill>
                        <VendorOption name="group">yes</VendorOption>
                    </TextSymbolizer>
                </Rule>
                <Rule>
                    <Name>Latitude line (500k)</Name>
                    <Title>Latitude line (500k)</Title>
                    <ogc:Filter>
                        <ogc:And>
                            <ogc:PropertyIsEqualTo>
                                <ogc:PropertyName>islatitude</ogc:PropertyName>
                                <ogc:Literal>T</ogc:Literal>
                            </ogc:PropertyIsEqualTo>
                            <ogc:PropertyIsGreaterThanOrEqualTo>
                                <ogc:PropertyName>increment</ogc:PropertyName>
                                <ogc:Literal>2</ogc:Literal>
                            </ogc:PropertyIsGreaterThanOrEqualTo>
                        </ogc:And>
                    </ogc:Filter>
                    <MinScaleDenominator>250000</MinScaleDenominator>
                    <MaxScaleDenominator>500000</MaxScaleDenominator>
                    <LineSymbolizer>
                        <Stroke>
                            <CssParameter name="stroke">#888888</CssParameter>
                            <CssParameter name="stroke-width">1.0</CssParameter>
                            <CssParameter name="stroke-opacity">0.4</CssParameter>
                        </Stroke>
                    </LineSymbolizer>
                    <TextSymbolizer>
                        <Label>
                            <ogc:PropertyName>label</ogc:PropertyName>
                        </Label>
                        <Font>
                            <CssParameter name="font-family">SansSerif</CssParameter>
                            <CssParameter name="font-size">10</CssParameter>
                        </Font>
                        <LabelPlacement>
                            <LinePlacement>
                                <PerpendicularOffset>5</PerpendicularOffset>
                            </LinePlacement>
                        </LabelPlacement>
                        <Fill>
                            <CssParameter name="fill">#aaaaaa</CssParameter>
                            <CssParameter name="fill-opacity">0.8</CssParameter>
                        </Fill>
                        <VendorOption name="group">yes</VendorOption>
                    </TextSymbolizer>
                </Rule>
                <Rule>
                    <Name>Latitude line (&lt;500k)</Name>
                    <Title>Latitude line (&lt;500k)</Title>
                    <ogc:Filter>
                        <ogc:And>
                            <ogc:PropertyIsEqualTo>
                                <ogc:PropertyName>islatitude</ogc:PropertyName>
                                <ogc:Literal>T</ogc:Literal>
                            </ogc:PropertyIsEqualTo>
                            <ogc:PropertyIsGreaterThanOrEqualTo>
                                <ogc:PropertyName>increment</ogc:PropertyName>
                                <ogc:Literal>1</ogc:Literal>
                            </ogc:PropertyIsGreaterThanOrEqualTo>
                        </ogc:And>
                    </ogc:Filter>
                    <MaxScaleDenominator>250000</MaxScaleDenominator>
                    <LineSymbolizer>
                        <Stroke>
                            <CssParameter name="stroke">#888888</CssParameter>
                            <CssParameter name="stroke-width">1.0</CssParameter>
                            <CssParameter name="stroke-opacity">0.4</CssParameter>
                        </Stroke>
                    </LineSymbolizer>
                    <TextSymbolizer>
                        <Label>
                            <ogc:PropertyName>label</ogc:PropertyName>
                        </Label>
                        <Font>
                            <CssParameter name="font-family">SansSerif</CssParameter>
                            <CssParameter name="font-size">10</CssParameter>
                        </Font>
                        <LabelPlacement>
                            <LinePlacement>
                                <PerpendicularOffset>5</PerpendicularOffset>
                            </LinePlacement>
                        </LabelPlacement>
                        <Fill>
                            <CssParameter name="fill">#aaaaaa</CssParameter>
                            <CssParameter name="fill-opacity">0.8</CssParameter>
                        </Fill>
                        <VendorOption name="group">yes</VendorOption>
                    </TextSymbolizer>
                </Rule>
                <Rule>
                    <Name>Longitude line (max scale)</Name>
                    <Title>Longitude line (max scale)</Title>
                    <ogc:Filter>
                        <ogc:And>
                            <ogc:PropertyIsEqualTo>
                                <ogc:PropertyName>islatitude</ogc:PropertyName>
                                <ogc:Literal>F</ogc:Literal>
                            </ogc:PropertyIsEqualTo>
                            <ogc:PropertyIsGreaterThanOrEqualTo>
                                <ogc:PropertyName>increment</ogc:PropertyName>
                                <ogc:Literal>5</ogc:Literal>
                            </ogc:PropertyIsGreaterThanOrEqualTo>
                        </ogc:And>
                    </ogc:Filter>
                    <MinScaleDenominator>10000000</MinScaleDenominator>
                    <LineSymbolizer>
                        <Stroke>
                            <CssParameter name="stroke">#888888</CssParameter>
                            <CssParameter name="stroke-width">0.2</CssParameter>
                            <CssParameter name="stroke-opacity">0.4</CssParameter>
                        </Stroke>
                    </LineSymbolizer>
                    <TextSymbolizer>
                        <Label>
                            <ogc:PropertyName>label</ogc:PropertyName>
                        </Label>
                        <Font>
                            <CssParameter name="font-family">SansSerif</CssParameter>
                            <CssParameter name="font-size">10</CssParameter>
                        </Font>
                        <LabelPlacement>
                            <LinePlacement>
                                <PerpendicularOffset>5</PerpendicularOffset>
                            </LinePlacement>
                        </LabelPlacement>
                        <Fill>
                            <CssParameter name="fill">#aaaaaa</CssParameter>
                            <CssParameter name="fill-opacity">0.8</CssParameter>
                        </Fill>
                        <VendorOption name="group">yes</VendorOption>
                    </TextSymbolizer>
                </Rule>
                <Rule>
                    <Name>Longitude line (10m)</Name>
                    <Title>Longitude line (10m)</Title>
                    <ogc:Filter>
                        <ogc:And>
                            <ogc:PropertyIsEqualTo>
                                <ogc:PropertyName>islatitude</ogc:PropertyName>
                                <ogc:Literal>F</ogc:Literal>
                            </ogc:PropertyIsEqualTo>
                            <ogc:PropertyIsGreaterThanOrEqualTo>
                                <ogc:PropertyName>increment</ogc:PropertyName>
                                <ogc:Literal>4</ogc:Literal>
                            </ogc:PropertyIsGreaterThanOrEqualTo>
                        </ogc:And>
                    </ogc:Filter>
                    <MinScaleDenominator>5000000</MinScaleDenominator>
                    <MaxScaleDenominator>10000000</MaxScaleDenominator>
                    <LineSymbolizer>
                        <Stroke>
                            <CssParameter name="stroke">#888888</CssParameter>
                            <CssParameter name="stroke-width">0.6</CssParameter>
                            <CssParameter name="stroke-opacity">0.4</CssParameter>
                        </Stroke>
                    </LineSymbolizer>
                    <TextSymbolizer>
                        <Label>
                            <ogc:PropertyName>label</ogc:PropertyName>
                        </Label>
                        <Font>
                            <CssParameter name="font-family">SansSerif</CssParameter>
                            <CssParameter name="font-size">10</CssParameter>
                        </Font>
                        <LabelPlacement>
                            <LinePlacement>
                                <PerpendicularOffset>5</PerpendicularOffset>
                            </LinePlacement>
                        </LabelPlacement>
                        <Fill>
                            <CssParameter name="fill">#aaaaaa</CssParameter>
                            <CssParameter name="fill-opacity">0.8</CssParameter>
                        </Fill>
                        <VendorOption name="group">yes</VendorOption>
                    </TextSymbolizer>
                </Rule>
                <Rule>
                    <Name>Longitude line (5m)</Name>
                    <Title>Longitude line (5m)</Title>
                    <ogc:Filter>
                        <ogc:And>
                            <ogc:PropertyIsEqualTo>
                                <ogc:PropertyName>islatitude</ogc:PropertyName>
                                <ogc:Literal>F</ogc:Literal>
                            </ogc:PropertyIsEqualTo>
                            <ogc:PropertyIsGreaterThanOrEqualTo>
                                <ogc:PropertyName>increment</ogc:PropertyName>
                                <ogc:Literal>3</ogc:Literal>
                            </ogc:PropertyIsGreaterThanOrEqualTo>
                        </ogc:And>
                    </ogc:Filter>
                    <MinScaleDenominator>1000000</MinScaleDenominator>
                    <MaxScaleDenominator>5000000</MaxScaleDenominator>
                    <LineSymbolizer>
                        <Stroke>
                            <CssParameter name="stroke">#888888</CssParameter>
                            <CssParameter name="stroke-width">1.0</CssParameter>
                            <CssParameter name="stroke-opacity">0.4</CssParameter>
                        </Stroke>
                    </LineSymbolizer>
                    <TextSymbolizer>
                        <Label>
                            <ogc:PropertyName>label</ogc:PropertyName>
                        </Label>
                        <Font>
                            <CssParameter name="font-family">SansSerif</CssParameter>
                            <CssParameter name="font-size">10</CssParameter>
                        </Font>
                        <LabelPlacement>
                            <LinePlacement>
                                <PerpendicularOffset>5</PerpendicularOffset>
                            </LinePlacement>
                        </LabelPlacement>
                        <Fill>
                            <CssParameter name="fill">#aaaaaa</CssParameter>
                            <CssParameter name="fill-opacity">0.8</CssParameter>
                        </Fill>
                        <VendorOption name="group">yes</VendorOption>
                    </TextSymbolizer>
                </Rule>
                <Rule>
                    <Name>Longitude line (500k)</Name>
                    <Title>Longitude line (500k)</Title>
                    <ogc:Filter>
                        <ogc:And>
                            <ogc:PropertyIsEqualTo>
                                <ogc:PropertyName>islatitude</ogc:PropertyName>
                                <ogc:Literal>F</ogc:Literal>
                            </ogc:PropertyIsEqualTo>
                            <ogc:PropertyIsGreaterThanOrEqualTo>
                                <ogc:PropertyName>increment</ogc:PropertyName>
                                <ogc:Literal>2</ogc:Literal>
                            </ogc:PropertyIsGreaterThanOrEqualTo>
                        </ogc:And>
                    </ogc:Filter>
                    <MinScaleDenominator>500000</MinScaleDenominator>
                    <MaxScaleDenominator>1000000</MaxScaleDenominator>
                    <LineSymbolizer>
                        <Stroke>
                            <CssParameter name="stroke">#888888</CssParameter>
                            <CssParameter name="stroke-width">1.0</CssParameter>
                            <CssParameter name="stroke-opacity">0.4</CssParameter>
                        </Stroke>
                    </LineSymbolizer>
                    <TextSymbolizer>
                        <Label>
                            <ogc:PropertyName>label</ogc:PropertyName>
                        </Label>
                        <Font>
                            <CssParameter name="font-family">SansSerif</CssParameter>
                            <CssParameter name="font-size">10</CssParameter>
                        </Font>
                        <LabelPlacement>
                            <LinePlacement>
                                <PerpendicularOffset>5</PerpendicularOffset>
                            </LinePlacement>
                        </LabelPlacement>
                        <Fill>
                            <CssParameter name="fill">#aaaaaa</CssParameter>
                            <CssParameter name="fill-opacity">0.8</CssParameter>
                        </Fill>
                        <VendorOption name="group">yes</VendorOption>
                    </TextSymbolizer>
                </Rule>
                <Rule>
                    <Name>Longitude line (&lt;500k)</Name>
                    <Title>Longitude line (&lt;500k)</Title>
                    <ogc:Filter>
                        <ogc:And>
                            <ogc:PropertyIsEqualTo>
                                <ogc:PropertyName>islatitude</ogc:PropertyName>
                                <ogc:Literal>F</ogc:Literal>
                            </ogc:PropertyIsEqualTo>
                            <ogc:PropertyIsGreaterThanOrEqualTo>
                                <ogc:PropertyName>increment</ogc:PropertyName>
                                <ogc:Literal>1</ogc:Literal>
                            </ogc:PropertyIsGreaterThanOrEqualTo>
                        </ogc:And>
                    </ogc:Filter>
                    <MaxScaleDenominator>500000</MaxScaleDenominator>
                    <LineSymbolizer>
                        <Stroke>
                            <CssParameter name="stroke">#888888</CssParameter>
                            <CssParameter name="stroke-width">1.0</CssParameter>
                            <CssParameter name="stroke-opacity">0.4</CssParameter>
                        </Stroke>
                    </LineSymbolizer>
                    <TextSymbolizer>
                        <Label>
                            <ogc:PropertyName>label</ogc:PropertyName>
                        </Label>
                        <Font>
                            <CssParameter name="font-family">SansSerif</CssParameter>
                            <CssParameter name="font-size">10</CssParameter>
                        </Font>
                        <LabelPlacement>
                            <LinePlacement>
                                <PerpendicularOffset>5</PerpendicularOffset>
                            </LinePlacement>
                        </LabelPlacement>
                        <Fill>
                            <CssParameter name="fill">#aaaaaa</CssParameter>
                            <CssParameter name="fill-opacity">0.8</CssParameter>
                        </Fill>
                        <VendorOption name="group">yes</VendorOption>
                    </TextSymbolizer>
                </Rule>
            </FeatureTypeStyle>
        </UserStyle>
    </NamedLayer>
</StyledLayerDescriptor>